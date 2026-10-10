package com.team4.sportscenter.common.exception;

public class PackageRuleException extends IllegalArgumentException {
    public final String code;
    public PackageRuleException(String code,String message){super(message);this.code=code;}
}
