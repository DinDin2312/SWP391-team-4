package com.team4.sportscenter;

import com.team4.sportscenter.config.DatabaseMigrationConfig;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/** Creates only disposable, uniquely named schemas; never modifies the supplied database. */
class DatabaseMigrationTests {
    private Connection connection;
    private String schema, url, user, password;
    @BeforeEach void createDisposableSchema() throws Exception {
        String parent=System.getenv("MIGRATION_TEST_URL");
        assumeTrue(parent!=null,"Set MIGRATION_TEST_URL to a MySQL server where disposable schemas may be created.");
        user=System.getenv("MIGRATION_TEST_USERNAME"); password=System.getenv("MIGRATION_TEST_PASSWORD");
        schema="sportcenter_flyway_test_"+UUID.randomUUID().toString().replace("-","");
        try(var admin=DriverManager.getConnection(parent,user,password);var statement=admin.createStatement()) {
            statement.execute("CREATE DATABASE `"+schema+"` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        }
        url=parent.replaceFirst("(^jdbc:mysql://[^/]+/)[^?]*","$1"+schema);
        assertTrue(url.contains("/"+schema),"Tests must connect only to their disposable schema");
        connection=DriverManager.getConnection(url,user,password);
    }
    @AfterEach void dropDisposableSchema() throws Exception {
        if(connection==null)return;
        try(var disposable=connection;var statement=disposable.createStatement()) {
            assertTrue(schema.startsWith("sportcenter_flyway_test_"));
            statement.execute("DROP DATABASE `"+schema+"`");
        }
    }
    Flyway flyway() {return Flyway.configure().dataSource(url,user,password).baselineVersion("1")
        .cleanDisabled(true).locations("classpath:db/migration").load();}
    void migrate() {new DatabaseMigrationConfig().recognizedLegacyDatabase().migrate(flyway());}
    void sql(String statement)throws Exception {try(var s=connection.createStatement()){s.execute(statement);}}
    long number(String query)throws Exception {try(var s=connection.createStatement();var r=s.executeQuery(query)){r.next();return r.getLong(1);}}
    String value(String query)throws Exception {try(var s=connection.createStatement();var r=s.executeQuery(query)){r.next();return r.getString(1);}}
    void manualSchema(boolean full)throws Exception {
        String ddl;
        try(var input=getClass().getResourceAsStream("/db/migration/V1__initial_sports_center_schema.sql")) {
            ddl=new String(input.readAllBytes(),StandardCharsets.UTF_8);
        }
        if(!full)ddl=ddl.substring(0,ddl.indexOf("ALTER TABLE USER_MEMBERSHIPS"));
        ddl=ddl.replaceAll("(?m)^--.*$","");
        for(var statement:ddl.split(";"))if(!statement.isBlank())sql(statement);
    }
    @Test void emptySchemaBootstrapsOnceAndRecordsFutureDates()throws Exception {
        migrate();assertEquals(4,flyway().info().applied().length);
        assertEquals(4,number("SELECT COUNT(*) FROM ROLES"));
        assertEquals(0,number("SELECT COUNT(*) FROM USERS"));
        sql("INSERT INTO USERS(full_name,email,password_hash) VALUES('New user','fresh@test.invalid','hash')");
        assertNotNull(value("SELECT created_at FROM USERS LIMIT 1"));
        assertThrows(SQLException.class,()->sql("INSERT INTO USERS(full_name,email,password_hash) VALUES('Duplicate','fresh@test.invalid','hash')"));
        assertEquals(0,flyway().migrate().migrationsExecuted);
        assertEquals(1,number("SELECT COUNT(*) FROM USERS"));
    }
    @Test void legacySchemaKeepsOldDatesUnknownAndReconcilesPackageColumns()throws Exception {
        manualSchema(false);
        sql("INSERT INTO ROLES VALUES(4,'Member')");
        sql("INSERT INTO USERS(user_id,role_id,full_name,email,password_hash) VALUES(1,4,'Old user','old@test.invalid','hash')");
        sql("INSERT INTO PACKAGES(package_id,package_name,package_type,duration_days,price) VALUES(1,'Legacy','GYM_ACCESS',30,500000)");
        sql("INSERT INTO USER_MEMBERSHIPS(user_id,package_id,status,start_date) VALUES(1,1,'ACTIVE','2020-01-02')");
        migrate();assertNull(value("SELECT created_at FROM USERS WHERE user_id=1"));
        assertEquals("Legacy",value("SELECT package_name_snapshot FROM USER_MEMBERSHIPS LIMIT 1"));
        assertEquals("2020-01-02 00:00:00",value("SELECT purchase_completed_at FROM USER_MEMBERSHIPS LIMIT 1"));
        assertEquals(4,number("SELECT COUNT(*) FROM ROLES"));
        assertEquals(1,number("SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='USERS' AND index_name='idx_users_created_at'"));
        assertEquals(0,flyway().migrate().migrationsExecuted);
        assertEquals(1,number("SELECT COUNT(*) FROM USER_MEMBERSHIPS"));
    }
    @Test void manuallyUpgradedSchemaPreservesDatesAndPurchasedSnapshots()throws Exception {
        manualSchema(true);
        sql("ALTER TABLE USERS ADD COLUMN created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP");
        sql("INSERT INTO USERS(user_id,full_name,email,password_hash,created_at) VALUES(1,'Known date','known@test.invalid','hash','2020-02-03 04:05:06')");
        sql("INSERT INTO PACKAGES(package_id,package_name,package_type,duration_days,price) VALUES(1,'New catalog name','GYM_ACCESS',90,800000)");
        sql("INSERT INTO USER_MEMBERSHIPS(user_id,package_id,package_name_snapshot,package_type_snapshot,duration_days_snapshot,price_snapshot,type_name_snapshot,purchase_completed_at,purchase_source) VALUES(1,1,'Purchased name','GYM_ACCESS',30,250000,'Purchased type','2020-02-03 04:05:06','ONLINE')");
        migrate();assertEquals("2020-02-03 04:05:06",value("SELECT created_at FROM USERS WHERE user_id=1"));
        assertEquals("Purchased name",value("SELECT package_name_snapshot FROM USER_MEMBERSHIPS LIMIT 1"));
        assertEquals(250000,number("SELECT price_snapshot FROM USER_MEMBERSHIPS LIMIT 1"));
        assertEquals("ONLINE",value("SELECT purchase_source FROM USER_MEMBERSHIPS LIMIT 1"));
        assertEquals(0,flyway().migrate().migrationsExecuted);
    }
    @Test void partialCreationDateMigrationRetainsExistingValues()throws Exception {
        manualSchema(false);sql("ALTER TABLE USERS ADD COLUMN created_at DATETIME NULL DEFAULT NULL");
        sql("INSERT INTO USERS(full_name,email,password_hash,created_at) VALUES('Known','partial@test.invalid','hash','2020-01-01 12:00:00')");
        migrate();assertEquals("2020-01-01 12:00:00",value("SELECT created_at FROM USERS LIMIT 1"));
        sql("INSERT INTO USERS(full_name,email,password_hash) VALUES('New','new@test.invalid','hash')");
        assertNotNull(value("SELECT created_at FROM USERS WHERE email='new@test.invalid'"));
    }
    @Test void unrelatedDatabaseIsRejectedBeforeBaseline()throws Exception {
        sql("CREATE TABLE unrelated(id int PRIMARY KEY)");
        assertThrows(IllegalStateException.class,this::migrate);
        assertEquals(0,number("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='flyway_schema_history'"));
    }
    @Test void changedAppliedMigrationFailsValidation()throws Exception {
        migrate();sql("UPDATE flyway_schema_history SET checksum=checksum+1 WHERE version='1'");
        assertThrows(org.flywaydb.core.api.exception.FlywayValidateException.class,this::migrate);
        assertEquals(0,number("SELECT COUNT(*) FROM USERS"));
    }
    @Test void springBootMigratesEmptySchemaBeforeHibernateValidation()throws Exception {
        try(var application=new org.springframework.boot.builder.SpringApplicationBuilder(SportscenterApplication.class).run(
                "--spring.datasource.url="+url,"--spring.datasource.username="+user,"--spring.datasource.password="+password,
                "--spring.jpa.hibernate.ddl-auto=validate","--spring.jpa.show-sql=false","--server.port=0")) {
            assertTrue(application.getBean(jakarta.persistence.EntityManagerFactory.class).isOpen());
            assertEquals(4,application.getBean(Flyway.class).info().applied().length);
            assertEquals(0,number("SELECT COUNT(*) FROM USERS"));
        }
    }
}
