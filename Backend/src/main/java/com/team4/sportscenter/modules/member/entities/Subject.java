package com.team4.sportscenter.modules.member.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "SUBJECTS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class    Subject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "subject_id")
    private Integer subjectId;

    @Column(name = "subject_name")
    private String subjectName;

    @Column(name = "description")
    private String description;
}
