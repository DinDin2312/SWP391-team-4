package com.team4.sportscenter.service.impl;

import com.team4.sportscenter.model.User;
import com.team4.sportscenter.repository.UserRepository;
import com.team4.sportscenter.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public User createUser(User user) {
        return userRepository.save(user);
    }
}
