package com.team4.sportscenter.modules.manager.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class AvatarStorageService {
    private static final long MAX_SIZE = 2L * 1024 * 1024;
    private static final Pattern SAFE_FILE_NAME = Pattern.compile("[0-9a-f-]{36}\\.(jpg|png)");
    private final Path storageRoot;

    public AvatarStorageService(@Value("${app.avatar-storage-dir:uploads/avatars}") String storageDirectory) {
        try {
            storageRoot = Path.of(storageDirectory).toAbsolutePath().normalize();
            Files.createDirectories(storageRoot);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to initialize avatar storage", exception);
        }
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Select an avatar image");
        if (file.getSize() > MAX_SIZE) throw new IllegalArgumentException("Avatar images must be 2 MB or smaller");

        String extension = detectExtension(file);
        String fileName = UUID.randomUUID().toString().toLowerCase(Locale.ROOT) + extension;
        Path destination = safePath(fileName);
        try (InputStream input = file.getInputStream()) {
            Files.copy(input, destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to save the avatar image", exception);
        }
        return fileName;
    }

    public AvatarFile load(String fileName) {
        Path file = safePath(fileName);
        if (!Files.isRegularFile(file)) throw new IllegalArgumentException("Avatar image not found");
        try {
            Resource resource = new UrlResource(file.toUri());
            MediaType mediaType = fileName.endsWith(".png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
            return new AvatarFile(resource, mediaType);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to read the avatar image", exception);
        }
    }

    public void delete(String fileName) {
        if (fileName == null || fileName.isBlank()) return;
        try {
            Files.deleteIfExists(safePath(fileName));
        } catch (IOException ignored) {
            // A stale file must not roll back an otherwise valid account update.
        }
    }

    private String detectExtension(MultipartFile file) {
        try (InputStream input = file.getInputStream()) {
            byte[] header = input.readNBytes(8);
            if (header.length >= 8 && (header[0] & 0xff) == 0x89 && header[1] == 0x50 && header[2] == 0x4e
                    && header[3] == 0x47 && header[4] == 0x0d && header[5] == 0x0a && header[6] == 0x1a && header[7] == 0x0a) {
                return ".png";
            }
            if (header.length >= 3 && (header[0] & 0xff) == 0xff && (header[1] & 0xff) == 0xd8 && (header[2] & 0xff) == 0xff) {
                return ".jpg";
            }
        } catch (IOException exception) {
            throw new IllegalArgumentException("Unable to read the avatar image", exception);
        }
        throw new IllegalArgumentException("Avatar must be a valid PNG or JPEG image");
    }

    private Path safePath(String fileName) {
        if (fileName == null || !SAFE_FILE_NAME.matcher(fileName).matches()) {
            throw new IllegalArgumentException("Invalid avatar path");
        }
        Path resolved = storageRoot.resolve(fileName).normalize();
        if (!resolved.getParent().equals(storageRoot)) throw new IllegalArgumentException("Invalid avatar path");
        return resolved;
    }

    public record AvatarFile(Resource resource, MediaType mediaType) {}
}
