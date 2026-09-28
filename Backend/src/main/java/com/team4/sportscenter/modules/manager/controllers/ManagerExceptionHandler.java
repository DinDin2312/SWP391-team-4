package com.team4.sportscenter.modules.manager.controllers;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashMap;
import java.util.Map;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = ManagerController.class)
public class ManagerExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> validation(MethodArgumentNotValidException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error ->
                fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng kiểm tra dữ liệu nhập.", "errors", fields));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<?> business(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(EmptyResultDataAccessException.class)
    ResponseEntity<?> missing() {
        return ResponseEntity.status(404).body(Map.of("message", "Dữ liệu không tồn tại hoặc đã bị xóa. Hãy tải lại trang."));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class})
    ResponseEntity<?> malformed() {
        return ResponseEntity.badRequest().body(Map.of("message", "Dữ liệu hoặc ngày giờ không hợp lệ."));
    }

    @ExceptionHandler({DataIntegrityViolationException.class, PessimisticLockingFailureException.class})
    ResponseEntity<?> conflict() {
        return ResponseEntity.status(409).body(Map.of("message", "Dữ liệu trùng, đang được sử dụng hoặc vừa thay đổi. Hãy tải lại và kiểm tra."));
    }
}
