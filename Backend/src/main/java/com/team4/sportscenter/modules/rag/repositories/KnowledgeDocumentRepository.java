package com.team4.sportscenter.modules.rag.repositories;

import com.team4.sportscenter.modules.rag.entities.Audience;
import com.team4.sportscenter.modules.rag.entities.KnowledgeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface KnowledgeDocumentRepository extends JpaRepository<KnowledgeDocument, Integer> {
    Optional<KnowledgeDocument> findBySourceKey(String sourceKey);
    List<KnowledgeDocument> findByAudienceIn(Collection<Audience> audiences);
}
