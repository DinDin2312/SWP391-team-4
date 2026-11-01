package com.team4.sportscenter.modules.rag.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "KNOWLEDGE_DOCUMENTS")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "document_id")
    private Integer documentId;

    @Column(name = "source_key", nullable = false, unique = true, length = 150)
    private String sourceKey;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "category", nullable = false, length = 40)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(name = "audience", nullable = false)
    private Audience audience;

    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
