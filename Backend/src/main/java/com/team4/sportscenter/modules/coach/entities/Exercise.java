package com.team4.sportscenter.modules.coach.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "EXERCISES")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "exercise_id")
    private Integer exerciseId;

    @Column(name = "exercise_name")
    private String exerciseName;

    @Column(name = "muscle_group")
    private String muscleGroup;

    @Column(name = "video_url")
    private String videoUrl;
}
