package com.team4.sportscenter.modules.manager.services;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PackageTypeCatalog {
    private final JdbcTemplate jdbc;
    public List<Map<String,Object>> list() {
        return jdbc.queryForList("SELECT type_code typeCode,type_name typeName,requires_subjects requiresSubjects FROM PACKAGE_TYPES ORDER BY type_name,type_code");
    }
    public Map<String,Object> require(String code) {
        var types=jdbc.queryForList("SELECT type_code typeCode,type_name typeName,requires_subjects requiresSubjects FROM PACKAGE_TYPES WHERE type_code=?",code);
        if(types.isEmpty())throw new IllegalArgumentException("Select an existing package type.");
        return types.get(0);
    }
    public String save(String code,String name,boolean requiresSubjects) {
        name=name.trim();
        if(name.isBlank() || name.length()>255)throw new IllegalArgumentException("Package type name must contain 1 to 255 characters.");
        if(code!=null)require(code);
        if(jdbc.queryForObject("SELECT COUNT(*) FROM PACKAGE_TYPES WHERE type_name=? AND type_code<>COALESCE(?, '')",Integer.class,name,code)>0)
            throw new IllegalArgumentException("A package type with this name already exists.");
        if(code==null){code="CUSTOM_"+UUID.randomUUID().toString();jdbc.update("INSERT INTO PACKAGE_TYPES(type_code,type_name,requires_subjects) VALUES(?,?,?)",code,name,requiresSubjects);}
        else jdbc.update("UPDATE PACKAGE_TYPES SET type_name=? WHERE type_code=?",name,code);
        return code;
    }
    public Map<String,String> names() {
        Map<String,String> names=new HashMap<>();
        for(var type:list())names.put((String)type.get("typeCode"),(String)type.get("typeName"));
        return names;
    }
}
