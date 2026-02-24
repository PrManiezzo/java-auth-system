package com.authapp.backend.service;

import com.authapp.backend.entity.finance.ServiceOrder;
import com.authapp.backend.entity.finance.ServiceOrderStatus;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendServiceOrderStatusNotification(ServiceOrder order, ServiceOrderStatus oldStatus, String recipientEmail) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("noreply@sistema.com");
            helper.setTo(recipientEmail);
            helper.setSubject("Atualização na Ordem de Serviço #" + order.getId());

            String htmlContent = buildServiceOrderStatusEmail(order, oldStatus);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
        }
    }

    private String buildServiceOrderStatusEmail(ServiceOrder order, ServiceOrderStatus oldStatus) {
        String statusLabel = getStatusLabel(order.getStatus());
        String oldStatusLabel = oldStatus != null ? getStatusLabel(oldStatus) : "";
        String statusColor = getStatusColor(order.getStatus());

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
                    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 6px; font-weight: bold; color: white; background: %s; }
                    .info-row { margin: 10px 0; padding: 10px; background: white; border-radius: 6px; }
                    .label { font-weight: bold; color: #64748b; }
                    .footer { text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔧 Ordem de Serviço #%d</h1>
                        <p>Status Atualizado</p>
                    </div>
                    <div class="content">
                        <p>Olá!</p>
                        <p>A ordem de serviço #%d teve seu status atualizado:</p>
                        
                        %s
                        
                        <div class="info-row">
                            <span class="label">Novo Status:</span>
                            <span class="status-badge">%s</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="label">Cliente:</span> %s
                        </div>
                        
                        <div class="info-row">
                            <span class="label">Descrição:</span> %s
                        </div>
                        
                        %s
                        
                        <div class="footer">
                            <p>Este é um email automático. Por favor, não responda.</p>
                            <p>© 2026 Sistema de Gestão</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                statusColor,
                order.getId(),
                order.getId(),
                oldStatus != null ? "<div class=\"info-row\"><span class=\"label\">Status Anterior:</span> " + oldStatusLabel + "</div>" : "",
                statusLabel,
                order.getCustomerName(),
                order.getDescription(),
                order.getAssignedTechnician() != null ? "<div class=\"info-row\"><span class=\"label\">Técnico:</span> " + order.getAssignedTechnician() + "</div>" : ""
        );
    }

    private String getStatusLabel(ServiceOrderStatus status) {
        return switch (status) {
            case PENDING -> "Pendente";
            case IN_PROGRESS -> "Em Andamento";
            case PAUSED -> "Pausado";
            case COMPLETED -> "Concluído";
            case CANCELLED -> "Cancelado";
        };
    }

    private String getStatusColor(ServiceOrderStatus status) {
        return switch (status) {
            case PENDING -> "#f59e0b";
            case IN_PROGRESS -> "#3b82f6";
            case PAUSED -> "#6b7280";
            case COMPLETED -> "#22c55e";
            case CANCELLED -> "#ef4444";
        };
    }
}
