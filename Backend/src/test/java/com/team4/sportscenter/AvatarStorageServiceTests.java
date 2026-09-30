package com.team4.sportscenter;

import com.team4.sportscenter.modules.manager.services.AvatarStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AvatarStorageServiceTests {
    @TempDir
    Path temporaryDirectory;

    @Test
    void storesPngUsingAServerGeneratedName() throws Exception {
        AvatarStorageService storage = new AvatarStorageService(temporaryDirectory.toString());
        byte[] png = new byte[] {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01};
        MockMultipartFile upload = new MockMultipartFile("avatar", "unsafe-name.png", "image/png", png);

        String storedName = storage.store(upload);

        assertTrue(storedName.matches("[0-9a-f-]{36}\\.png"));
        assertTrue(storage.load(storedName).resource().exists());
        assertEquals("image/png", storage.load(storedName).mediaType().toString());
    }

    @Test
    void rejectsContentThatIsNotAnImage() {
        AvatarStorageService storage = new AvatarStorageService(temporaryDirectory.toString());
        MockMultipartFile upload = new MockMultipartFile("avatar", "avatar.png", "image/png", "not an image".getBytes());

        assertThrows(IllegalArgumentException.class, () -> storage.store(upload));
    }

    @Test
    void rejectsUnsafeFileNamesWhenReading() {
        AvatarStorageService storage = new AvatarStorageService(temporaryDirectory.toString());

        assertThrows(IllegalArgumentException.class, () -> storage.load("../secret.png"));
    }
}
