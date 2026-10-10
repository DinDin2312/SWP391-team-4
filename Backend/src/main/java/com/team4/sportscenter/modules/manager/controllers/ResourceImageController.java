package com.team4.sportscenter.modules.manager.controllers;

import com.team4.sportscenter.modules.manager.services.ResourceImageStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/resource-images")
@RequiredArgsConstructor
public class ResourceImageController {
    private final ResourceImageStorageService storage;

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<Void> missingImage(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode()).build();
    }

    @GetMapping("/{name}")
    public ResponseEntity<Resource> image(@PathVariable String name) {
        return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG)
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic().immutable())
                .body(storage.load(name));
    }
}
