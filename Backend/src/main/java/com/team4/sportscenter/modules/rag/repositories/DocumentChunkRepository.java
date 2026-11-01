package com.team4.sportscenter.modules.rag.repositories;

import com.team4.sportscenter.modules.rag.entities.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {
    List<DocumentChunk> findByDocumentIdOrderByChunkIndexAsc(Integer documentId);

    List<DocumentChunk> findByDocumentIdIn(Collection<Integer> documentIds);

    @Modifying
    @Query("DELETE FROM DocumentChunk dc WHERE dc.documentId = :documentId")
    void deleteByDocumentId(Integer documentId);
}
