package com.team4.sportscenter;

import com.team4.sportscenter.modules.manager.services.ResourceImageStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class ResourceImageStorageServiceTests {
    @TempDir Path directory;

    static byte[] image(int width, int height, String format) throws Exception {
        var output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB), format, output);
        return output.toByteArray();
    }

    @Test void decodesResizesAndReencodesPngWithoutTrustingClientFileName() throws Exception {
        var storage = new ResourceImageStorageService(directory.toString());
        String name = storage.store(new MockMultipartFile("image", "../../payload.png", "image/png", image(3200, 1600, "png")));
        assertTrue(name.matches("[0-9a-f-]{36}\\.jpg"));
        BufferedImage normalized;
        try (var stream = storage.load(name).getInputStream()) { normalized = ImageIO.read(stream); }
        assertEquals(1600, normalized.getWidth()); assertEquals(800, normalized.getHeight());
        storage.delete(name);
        assertThrows(ResponseStatusException.class, () -> storage.load(name));
    }

    @Test void rejectsDisguisedOrTruncatedImagesAndUnsupportedFormats() throws Exception {
        var storage = new ResourceImageStorageService(directory.toString());
        assertThrows(IllegalArgumentException.class, () -> storage.store(new MockMultipartFile("image", "x.jpg", "image/jpeg", "<svg onload='alert(1)'/>".getBytes())));
        assertThrows(IllegalArgumentException.class, () -> storage.store(new MockMultipartFile("image", "x.png", "image/png", new byte[] {(byte)137, 80, 78, 71, 13, 10, 26, 10})));
        assertThrows(IllegalArgumentException.class, () -> storage.store(new MockMultipartFile("image", "x.png", "image/png", image(10, 10, "gif"))));
    }

    @Test void rejectsOversizedUploadsAndDecodedDimensions() throws Exception {
        var storage = new ResourceImageStorageService(directory.toString());
        assertThrows(IllegalArgumentException.class, () -> storage.store(new MockMultipartFile("image", new byte[2 * 1024 * 1024 + 1])));
        assertThrows(IllegalArgumentException.class, () -> storage.store(new MockMultipartFile("image", "large.png", "image/png", image(4100, 4100, "png"))));
    }

    @Test void onlyServesServerGeneratedNamesAndDoesNotDeleteOutsideStorage() throws Exception {
        var storage = new ResourceImageStorageService(directory.resolve("photos").toString());
        Path outside = directory.resolve("keep.jpg"); Files.writeString(outside, "keep");
        assertThrows(ResponseStatusException.class, () -> storage.load("../keep.jpg"));
        storage.delete("../keep.jpg");
        assertTrue(Files.exists(outside));
    }
}
