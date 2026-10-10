package com.team4.sportscenter.modules.manager.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

/** Resource photos are decoded and re-encoded, never served as arbitrary uploaded bytes. */
@Service
public class ResourceImageStorageService {
    private static final long MAX_SIZE = 2L * 1024 * 1024;
    private static final long MAX_PIXELS = 16_000_000;
    private static final int MAX_SIDE = 1600;
    private static final Pattern FILE_NAME = Pattern.compile("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.jpg");
    private final Path root;

    public ResourceImageStorageService(@Value("${app.resource-image-storage-dir:uploads/resource-images}") String directory) {
        try { root = Path.of(directory).toAbsolutePath().normalize(); Files.createDirectories(root); }
        catch (IOException failure) { throw new IllegalStateException("Unable to initialize resource image storage", failure); }
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Select an image.");
        if (file.getSize() > MAX_SIZE) throw new IllegalArgumentException("Images must be 2 MB or smaller.");
        BufferedImage decoded;
        try (var input = file.getInputStream(); ImageInputStream stream = ImageIO.createImageInputStream(input)) {
            if (stream == null) throw new IllegalArgumentException("Choose a valid PNG or JPEG image.");
            Iterator<ImageReader> readers = ImageIO.getImageReaders(stream);
            if (!readers.hasNext()) throw new IllegalArgumentException("Choose a valid PNG or JPEG image.");
            ImageReader reader = readers.next();
            try {
                String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                if (!format.equals("png") && !format.equals("jpeg") && !format.equals("jpg")) throw new IllegalArgumentException("Choose a valid PNG or JPEG image.");
                reader.setInput(stream, true, true);
                int width = reader.getWidth(0), height = reader.getHeight(0);
                if (width < 1 || height < 1 || (long) width * height > MAX_PIXELS) throw new IllegalArgumentException("Images must contain at most 16 million pixels.");
                decoded = reader.read(0);
                if (decoded == null) throw new IllegalArgumentException("Choose a valid PNG or JPEG image.");
            } finally { reader.dispose(); }
        } catch (IOException failure) { throw new IllegalArgumentException("Choose a valid PNG or JPEG image.", failure); }
        double scale = Math.min(1, (double) MAX_SIDE / Math.max(decoded.getWidth(), decoded.getHeight()));
        BufferedImage normalized = new BufferedImage(Math.max(1, (int) Math.round(decoded.getWidth() * scale)), Math.max(1, (int) Math.round(decoded.getHeight() * scale)), BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = normalized.createGraphics();
        try {
            graphics.setColor(Color.WHITE); graphics.fillRect(0, 0, normalized.getWidth(), normalized.getHeight());
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            graphics.drawImage(decoded, 0, 0, normalized.getWidth(), normalized.getHeight(), null);
        } finally { graphics.dispose(); decoded.flush(); }
        String name = UUID.randomUUID() + ".jpg";
        Path destination = path(name);
        try {
            if (!ImageIO.write(normalized, "jpg", destination.toFile())) throw new IOException("JPEG encoder unavailable");
            return name;
        } catch (IOException failure) {
            delete(name);
            throw new IllegalStateException("Unable to save the image.", failure);
        } finally { normalized.flush(); }
    }

    public Resource load(String name) {
        if (name == null || !FILE_NAME.matcher(name).matches()) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        Path file = path(name);
        if (!Files.isRegularFile(file)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        try { return new UrlResource(file.toUri()); }
        catch (IOException failure) { throw new IllegalStateException("Unable to read the image.", failure); }
    }

    public void delete(String name) {
        if (name == null || !FILE_NAME.matcher(name).matches()) return;
        try { Files.deleteIfExists(path(name)); }
        catch (IOException ignored) { /* A cleanup failure must not undo a committed edit. */ }
    }

    private Path path(String name) {
        if (name == null || !FILE_NAME.matcher(name).matches()) throw new IllegalArgumentException("Invalid image path");
        return root.resolve(name);
    }
}
