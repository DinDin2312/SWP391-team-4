package com.team4.sportscenter;

import com.team4.sportscenter.modules.rag.services.VectorMath;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class VectorMathTests {

    @Test
    void cosine_identicalVectorsReturnOne() {
        float[] a = new float[]{1.0f, 2.0f, 3.0f};
        float[] b = new float[]{1.0f, 2.0f, 3.0f};
        assertEquals(1.0, VectorMath.cosine(a, b), 1e-5);
    }

    @Test
    void cosine_orthogonalVectorsReturnZero() {
        float[] a = new float[]{1.0f, 0.0f};
        float[] b = new float[]{0.0f, 1.0f};
        assertEquals(0.0, VectorMath.cosine(a, b), 1e-5);
    }

    @Test
    void cosine_oppositeVectorsReturnMinusOne() {
        float[] a = new float[]{1.0f, 0.0f};
        float[] b = new float[]{-1.0f, 0.0f};
        assertEquals(-1.0, VectorMath.cosine(a, b), 1e-5);
    }

    @Test
    void cosine_zeroVectorReturnsZero() {
        float[] a = new float[]{0.0f, 0.0f, 0.0f};
        float[] b = new float[]{1.0f, 2.0f, 3.0f};
        assertEquals(0.0, VectorMath.cosine(a, b), 1e-5);
    }

    @Test
    void cosine_lengthMismatchThrows() {
        float[] a = new float[]{1.0f, 2.0f};
        float[] b = new float[]{1.0f, 2.0f, 3.0f};
        assertThrows(IllegalArgumentException.class, () -> VectorMath.cosine(a, b));
    }
}
