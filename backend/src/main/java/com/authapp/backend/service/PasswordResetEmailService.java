package com.authapp.backend.service;

import com.authapp.backend.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetEmailService {

    private final JavaMailSender mailSender;
    private final String from;

    public PasswordResetEmailService(JavaMailSender mailSender,
                                     @Value("${app.mail.from}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    public void sendResetEmail(User user, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(user.getEmail());
        message.setSubject("Recuperação de senha");
        message.setText("""
                Olá, %s!

                Recebemos uma solicitação para redefinir sua senha.
                Use o link abaixo para continuar:

                %s

                O link expira em 30 minutos.

                Se você não solicitou esta alteração, ignore este e-mail.
                """.formatted(user.getName(), resetLink));

        mailSender.send(message);
    }
}
