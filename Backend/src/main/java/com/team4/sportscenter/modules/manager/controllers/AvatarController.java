package com.team4.sportscenter.modules.manager.controllers;

import com.team4.sportscenter.modules.manager.services.AvatarStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/avatars")
@RequiredArgsConstructor
public class AvatarController {
    private final AvatarStorageService avatarStorageService;

    @GetMapping("/{fileName}")
    public ResponseEntity<Resource> avatar(@PathVariable String fileName) {
        AvatarStorageService.AvatarFile avatar = avatarStorageService.load(fileName);
        return ResponseEntity.ok()
                .contentType(avatar.mediaType())
                .cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic().immutable())
                .body(avatar.resource());
    }
}
