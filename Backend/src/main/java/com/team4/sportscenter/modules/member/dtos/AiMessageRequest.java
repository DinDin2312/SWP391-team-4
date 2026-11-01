package com.team4.sportscenter.modules.member.dtos;

import com.team4.sportscenter.modules.rag.gemini.Turn;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiMessageRequest {
    private String message;
    private List<Turn> history;
}
