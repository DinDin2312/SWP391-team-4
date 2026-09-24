package com.team4.sportscenter.modules.auth.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "ROLES")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "role_id")
    private Integer roleId;
    
    @Column(name = "role_name", nullable = false)
    private String roleName;

    @OneToMany(mappedBy = "role")
    private List<User> users;
}
