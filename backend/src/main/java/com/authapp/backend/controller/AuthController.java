package com.authapp.backend.controller;

import com.authapp.backend.dto.AuthResponse;
import com.authapp.backend.dto.ForgotPasswordRequest;
import com.authapp.backend.dto.LoginRequest;
import com.authapp.backend.dto.MessageResponse;
import com.authapp.backend.dto.RegisterRequest;
import com.authapp.backend.dto.ResetPasswordRequest;
import com.authapp.backend.entity.PasswordResetToken;
import com.authapp.backend.entity.User;
import com.authapp.backend.repository.PasswordResetTokenRepository;
import com.authapp.backend.repository.UserRepository;
import com.authapp.backend.security.JwtService;
import com.authapp.backend.service.PasswordResetEmailService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.mail.MailException;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final long TWO_HOURS_SECONDS = 2 * 60 * 60;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetEmailService passwordResetEmailService;
    private final String resetBaseUrl;
    private final boolean returnResetTokenForTesting;

    public AuthController(UserRepository userRepository,
                          PasswordResetTokenRepository passwordResetTokenRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService,
                          PasswordResetEmailService passwordResetEmailService,
                          @Value("${app.reset.frontend-url}") String resetBaseUrl,
                          @Value("${app.reset.return-token-for-testing:false}") boolean returnResetTokenForTesting) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.passwordResetEmailService = passwordResetEmailService;
        this.resetBaseUrl = resetBaseUrl;
        this.returnResetTokenForTesting = returnResetTokenForTesting;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.badRequest().body(new MessageResponse("E-mail já cadastrado"));
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email().toLowerCase())
                .password(passwordEncoder.encode(request.password()))
                .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(new MessageResponse("Usuário criado com sucesso"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.email().toLowerCase()).orElse(null);
        if (user == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Credenciais inválidas"));
        }

        String token = jwtService.generateToken(user.getEmail());
        AuthResponse response = new AuthResponse(token, "Bearer", TWO_HOURS_SECONDS, user.getName(), user.getEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.email().toLowerCase()).orElse(null);
        if (user == null) {
            return ResponseEntity.ok(new MessageResponse("Se o e-mail existir, enviaremos as instruções"));
        }

        passwordResetTokenRepository.deleteByUserAndUsedFalse(user);

        String token = UUID.randomUUID().toString().replace("-", "");
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .used(false)
                .build();

        passwordResetTokenRepository.save(resetToken);

        String resetLink = resetBaseUrl + "?token=" + token;

        try {
            passwordResetEmailService.sendResetEmail(user, resetLink);
        } catch (MailException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Não foi possível enviar o e-mail de recuperação"));
        }

        if (returnResetTokenForTesting) {
            return ResponseEntity.ok(Map.of(
                    "message", "E-mail de recuperação enviado com sucesso",
                    "resetToken", token,
                    "expiresInMinutes", 30
            ));
        }

        return ResponseEntity.ok(new MessageResponse("E-mail de recuperação enviado com sucesso"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        PasswordResetToken token = passwordResetTokenRepository.findByToken(request.token()).orElse(null);
        if (token == null || token.isUsed() || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Token inválido ou expirado"));
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        token.setUsed(true);
        passwordResetTokenRepository.save(token);

        return ResponseEntity.ok(new MessageResponse("Senha alterada com sucesso"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Não autenticado"));
        }

        return ResponseEntity.ok(Map.of(
                "name", user.getName(),
                "email", user.getEmail(),
            "phone", user.getPhone() == null ? "" : user.getPhone(),
            "city", user.getCity() == null ? "" : user.getCity(),
            "bio", user.getBio() == null ? "" : user.getBio(),
            "avatarBase64", user.getAvatarBase64() == null ? "" : user.getAvatarBase64(),
                "logged", true
        ));
    }
}
