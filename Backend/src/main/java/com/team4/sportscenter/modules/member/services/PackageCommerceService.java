package com.team4.sportscenter.modules.member.services;

import com.team4.sportscenter.common.exception.PackageRuleException;
import com.team4.sportscenter.modules.manager.dtos.request.ManagerRequests.PackageRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class PackageCommerceService {
    private final JdbcTemplate jdbc;
    private final PackageBenefitsService benefits;
    private final com.team4.sportscenter.modules.manager.repositories.ManagerRepository locks;
    private final com.fasterxml.jackson.databind.ObjectMapper json=new com.fasterxml.jackson.databind.ObjectMapper();

    @Transactional(propagation=org.springframework.transaction.annotation.Propagation.SUPPORTS,noRollbackFor=PackageRuleException.class)
    public void checkPurchase(int userId,int packageId,Integer ownInvoice,boolean requireSelling) {
        var pkg=jdbc.queryForMap("SELECT selling_status,purchase_limit_per_member FROM PACKAGES WHERE package_id=?",packageId);
        if(requireSelling && !"SELLING".equals(pkg.get("selling_status")))throw new PackageRuleException("PACKAGE_NOT_SELLING","This package is no longer selling. Choose a currently available package.");
        if(pkg.get("purchase_limit_per_member")==null)return;
        int limit=((Number)pkg.get("purchase_limit_per_member")).intValue();
        int completed=jdbc.queryForObject("SELECT COUNT(*) FROM USER_MEMBERSHIPS WHERE user_id=? AND package_id=? AND purchase_completed_at IS NOT NULL",Integer.class,userId,packageId);
        if(completed>=limit)throw new PackageRuleException("PACKAGE_PURCHASE_LIMIT_REACHED","You have reached the purchase limit for this package.");
        int pending=jdbc.queryForObject("""
            SELECT COUNT(*) FROM USER_MEMBERSHIPS m JOIN INVOICES i ON i.invoice_id=m.checkout_invoice_id
            WHERE m.user_id=? AND m.package_id=? AND m.purchase_completed_at IS NULL
            AND i.status='PENDING' AND i.created_at>DATE_SUB(NOW(),INTERVAL 15 MINUTE)
            AND i.invoice_id<>COALESCE(?,0)
            """,Integer.class,userId,packageId,ownInvoice);
        if(completed+pending>=limit)throw new PackageRuleException("PACKAGE_CHECKOUT_PENDING","A checkout for this package is awaiting payment. Complete it or wait for it to expire.");
    }

    public Map<String,Object> eligibility(int userId,int packageId){
        try{checkPurchase(userId,packageId,null,true);return Map.of("canPurchase",true);}
        catch(PackageRuleException e){return Map.of("canPurchase",false,"purchaseBlockCode",e.code,"purchaseBlockReason",e.getMessage());}
    }

    @Transactional(readOnly=true)
    public Map<String,Object> detail(int id){
        var row=jdbc.queryForMap("""
            SELECT p.package_id packageId,p.package_name packageName,p.package_type packageType,t.type_name packageTypeName,
              p.duration_days durationDays,p.price,p.image_path imagePath,p.description,p.terms,
              p.purchase_limit_per_member purchaseLimitPerMember,p.selling_status sellingStatus,
              (SELECT COUNT(*) FROM USER_MEMBERSHIPS m WHERE m.package_id=p.package_id AND m.status='ACTIVE' AND m.start_date<=CURDATE() AND m.end_date>=CURDATE()) activeSubscribers
            FROM PACKAGES p LEFT JOIN PACKAGE_TYPES t ON t.type_code=p.package_type WHERE p.package_id=?
            """,id);
        row.put("benefits",benefits.packageBenefits(id));return row;
    }

    public Map<String,Object> publicDetail(int id,Integer userId){
        var row=detail(id);
        if(!"SELLING".equals(row.get("sellingStatus")))throw new PackageRuleException("PACKAGE_NOT_SELLING","This package is no longer selling.");
        row.remove("activeSubscribers");if(userId!=null)row.putAll(eligibility(userId,id));return row;
    }

    @Transactional(readOnly=true)
    public Map<String,Object> purchasedDetail(String email,int membershipId){
        var row=jdbc.queryForMap("""
            SELECT m.membership_id membershipId,m.package_id packageId,m.package_name_snapshot packageName,
              m.package_type_snapshot packageType,m.type_name_snapshot packageTypeName,m.duration_days_snapshot durationDays,
              m.price_snapshot price,m.description_snapshot description,m.terms_snapshot terms,
              m.start_date startDate,m.end_date endDate,m.status,p.image_path imagePath
            FROM USER_MEMBERSHIPS m JOIN USERS u ON u.user_id=m.user_id JOIN PACKAGES p ON p.package_id=m.package_id
            WHERE m.membership_id=? AND u.email=? AND m.purchase_completed_at IS NOT NULL
            """,membershipId,email);
        row.put("benefits",benefits.membershipBenefits(membershipId));return row;
    }

    public void saveContent(int id,PackageRequest r){
        if(r.description()!=null)jdbc.update("UPDATE PACKAGES SET description=? WHERE package_id=?",r.description(),id);
        if(r.terms()!=null)jdbc.update("UPDATE PACKAGES SET terms=? WHERE package_id=?",r.terms(),id);
        if(Boolean.TRUE.equals(r.updatePurchaseLimit())||r.purchaseLimitPerMember()!=null)
            jdbc.update("UPDATE PACKAGES SET purchase_limit_per_member=? WHERE package_id=?",r.purchaseLimitPerMember(),id);
    }

    public void selling(int id,String status,String actor){
        if(!Set.of("SELLING","STOPPED").contains(status))throw new IllegalArgumentException("Invalid selling status.");
        locks.lockOperations();var before=detail(id);
        jdbc.update("UPDATE PACKAGES SET selling_status=? WHERE package_id=?",status,id);
        audit(id,"STATUS_CHANGE",actor,before,detail(id));
    }

    public void audit(int id,String action,String actor,Map<String,Object> before,Map<String,Object> after){
        var changes=new LinkedHashMap<String,Object>();
        for(String key:List.of("packageName","packageType","durationDays","price","description","terms","benefits","purchaseLimitPerMember","sellingStatus")){
            var old=before.get(key);var next=after.get(key);
            if(!Objects.equals(old,next)){var field=new LinkedHashMap<String,Object>();field.put("before",shortValue(old));field.put("after",shortValue(next));changes.put(key,field);}
        }
        if(!Objects.equals(before.get("imagePath"),after.get("imagePath")))changes.put("image",Map.of("changed",true));
        if(changes.isEmpty())return;
        try{jdbc.update("INSERT INTO AUDIT_LOGS(actor_email,action,entity_type,entity_id,details,changes_json,created_at) VALUES(?,?,'PACKAGE',?,?,?,NOW())",actor,action,String.valueOf(id),"Package changes: "+String.join(", ",changes.keySet()),json.writeValueAsString(Map.of("version",1,"fields",changes)));}
        catch(com.fasterxml.jackson.core.JsonProcessingException e){throw new IllegalStateException(e);}
    }
    private Object shortValue(Object value){return value instanceof String text && text.length()>300?text.substring(0,300)+"… [changed]":value;}

    @Transactional(readOnly=true)
    public Map<String,Object> history(int id,int page){
        detail(id);page=Math.max(1,page);
        var rows=jdbc.queryForList("SELECT actor_email actor,action,details,changes_json changes,created_at createdAt FROM AUDIT_LOGS WHERE entity_type IN('PACKAGE','PACKAGES') AND entity_id=? ORDER BY created_at DESC,audit_id DESC LIMIT 20 OFFSET ?",String.valueOf(id),(page-1)*20);
        for(var row:rows)if(row.get("changes")!=null)try{row.put("changes",json.readValue((String)row.get("changes"),Map.class));}catch(Exception e){row.put("changes",null);}
        return Map.of("items",rows,"page",page,"total",jdbc.queryForObject("SELECT COUNT(*) FROM AUDIT_LOGS WHERE entity_type IN('PACKAGE','PACKAGES') AND entity_id=?",Integer.class,String.valueOf(id)));
    }
}
