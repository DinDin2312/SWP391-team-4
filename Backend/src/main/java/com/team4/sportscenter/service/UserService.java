package com.team4.sportscenter.service;

import com.team4.sportscenter.model.User;
import java.util.Optional;

public interface UserService {
    Optional<User> getUserByUsername(String username);
    User createUser(User user);
}
