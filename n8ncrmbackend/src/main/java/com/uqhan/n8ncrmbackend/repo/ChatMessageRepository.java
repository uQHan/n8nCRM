package com.uqhan.n8ncrmbackend.repo;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.uqhan.n8ncrmbackend.entity.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
	List<ChatMessage> findBySession_IdOrderByCreatedAtAsc(UUID sessionId);

	@Query("select m from ChatMessage m where m.session.id = :sessionId order by m.createdAt desc")
	List<ChatMessage> findRecent(@Param("sessionId") UUID sessionId, Pageable pageable);
}
