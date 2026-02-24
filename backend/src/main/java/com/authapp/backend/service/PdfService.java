package com.authapp.backend.service;

import com.authapp.backend.entity.finance.*;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class PdfService {

    private static final NumberFormat CURRENCY_FORMAT = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DeviceRgb BLUE_COLOR = new DeviceRgb(59, 130, 246);
    private static final DeviceRgb GRAY_COLOR = new DeviceRgb(100, 116, 139);

    public byte[] generateQuotePdf(Quote quote) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // Header
        Paragraph title = new Paragraph("ORÇAMENTO #" + quote.getId())
                .setFontSize(24)
                .setBold()
                .setFontColor(BLUE_COLOR)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(title);

        document.add(new Paragraph("\n"));

        // Customer Info
        Table infoTable = new Table(2).useAllAvailableWidth();
        addInfoRow(infoTable, "Cliente:", quote.getCustomerName());
        addInfoRow(infoTable, "Data de Emissão:", quote.getIssueDate().format(DATE_FORMAT));
        addInfoRow(infoTable, "Válido até:", quote.getValidUntil().format(DATE_FORMAT));
        addInfoRow(infoTable, "Status:", getStatusLabel(quote.getStatus().name()));
        document.add(infoTable);

        document.add(new Paragraph("\n"));

        // Items Table
        Paragraph itemsTitle = new Paragraph("Itens do Orçamento")
                .setFontSize(16)
                .setBold()
                .setFontColor(BLUE_COLOR);
        document.add(itemsTitle);

        Table itemsTable = new Table(new float[]{4, 1, 1, 1, 2}).useAllAvailableWidth();
        itemsTable.setMarginTop(10);

        // Headers
        addHeaderCell(itemsTable, "Descrição");
        addHeaderCell(itemsTable, "Unidade");
        addHeaderCell(itemsTable, "Qtd");
        addHeaderCell(itemsTable, "Valor Unit.");
        addHeaderCell(itemsTable, "Total");

        // Items
        for (QuoteItem item : quote.getItems()) {
            itemsTable.addCell(new Cell().add(new Paragraph(item.getDescription())));
            itemsTable.addCell(new Cell().add(new Paragraph(item.getUnit())));
            itemsTable.addCell(new Cell().add(new Paragraph(String.valueOf(item.getQuantity()))));
            itemsTable.addCell(new Cell().add(new Paragraph(formatCurrency(item.getUnitPrice()))));
            itemsTable.addCell(new Cell().add(new Paragraph(formatCurrency(item.getTotal()))).setBold());
        }

        document.add(itemsTable);

        // Total
        document.add(new Paragraph("\n"));
        Table totalTable = new Table(2).useAllAvailableWidth();
        totalTable.addCell(new Cell().add(new Paragraph("TOTAL").setBold().setFontSize(14)).setBorder(null).setTextAlignment(TextAlignment.RIGHT));
        totalTable.addCell(new Cell().add(new Paragraph(formatCurrency(quote.getTotal())).setBold().setFontSize(14).setFontColor(BLUE_COLOR)).setBorder(null));
        document.add(totalTable);

        // Notes
        if (quote.getNotes() != null && !quote.getNotes().isEmpty()) {
            document.add(new Paragraph("\n"));
            document.add(new Paragraph("Observações:").setBold().setFontSize(12));
            document.add(new Paragraph(quote.getNotes()).setFontColor(GRAY_COLOR));
        }

        // Footer
        document.add(new Paragraph("\n\n"));
        document.add(new Paragraph("Documento gerado em " + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                .setFontSize(8)
                .setFontColor(GRAY_COLOR)
                .setTextAlignment(TextAlignment.CENTER));

        document.close();
        return baos.toByteArray();
    }

    public byte[] generateServiceOrderPdf(ServiceOrder order) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // Header
        Paragraph title = new Paragraph("ORDEM DE SERVIÇO #" + order.getId())
                .setFontSize(24)
                .setBold()
                .setFontColor(BLUE_COLOR)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(title);

        document.add(new Paragraph("\n"));

        // Customer Info
        Table infoTable = new Table(2).useAllAvailableWidth();
        addInfoRow(infoTable, "Cliente:", order.getCustomerName());
        if (order.getCustomerPhone() != null) {
            addInfoRow(infoTable, "Telefone:", order.getCustomerPhone());
        }
        if (order.getCustomerAddress() != null) {
            addInfoRow(infoTable, "Endereço:", order.getCustomerAddress());
        }
        addInfoRow(infoTable, "Data de Início:", order.getStartDate().format(DATE_FORMAT));
        if (order.getEstimatedEndDate() != null) {
            addInfoRow(infoTable, "Previsão de Término:", order.getEstimatedEndDate().format(DATE_FORMAT));
        }
        if (order.getAssignedTechnician() != null) {
            addInfoRow(infoTable, "Técnico:", order.getAssignedTechnician());
        }
        addInfoRow(infoTable, "Status:", getStatusLabel(order.getStatus().name()));
        document.add(infoTable);

        document.add(new Paragraph("\n"));

        // Description
        document.add(new Paragraph("Descrição do Serviço:").setBold().setFontSize(12));
        document.add(new Paragraph(order.getDescription()).setFontColor(GRAY_COLOR));

        document.add(new Paragraph("\n"));

        // Items Table
        Paragraph itemsTitle = new Paragraph("Itens e Serviços")
                .setFontSize(16)
                .setBold()
                .setFontColor(BLUE_COLOR);
        document.add(itemsTitle);

        Table itemsTable = new Table(new float[]{4, 1, 1, 1, 2}).useAllAvailableWidth();
        itemsTable.setMarginTop(10);

        // Headers
        addHeaderCell(itemsTable, "Item");
        addHeaderCell(itemsTable, "Tipo");
        addHeaderCell(itemsTable, "Qtd");
        addHeaderCell(itemsTable, "Valor Unit.");
        addHeaderCell(itemsTable, "Total");

        // Items
        for (ServiceOrderItem item : order.getItems()) {
            itemsTable.addCell(new Cell().add(new Paragraph(item.getItemName())));
            itemsTable.addCell(new Cell().add(new Paragraph(item.getIsService() ? "Serviço" : "Peça")));
            itemsTable.addCell(new Cell().add(new Paragraph(String.valueOf(item.getQuantity()))));
            itemsTable.addCell(new Cell().add(new Paragraph(formatCurrency(item.getUnitPrice()))));
            itemsTable.addCell(new Cell().add(new Paragraph(formatCurrency(item.getTotal()))).setBold());
        }

        document.add(itemsTable);

        // Totals
        document.add(new Paragraph("\n"));
        Table totalTable = new Table(2).useAllAvailableWidth();
        totalTable.addCell(new Cell().add(new Paragraph("Mão de Obra:").setBold()).setBorder(null).setTextAlignment(TextAlignment.RIGHT));
        totalTable.addCell(new Cell().add(new Paragraph(formatCurrency(order.getLaborCost()))).setBorder(null));
        totalTable.addCell(new Cell().add(new Paragraph("Peças:").setBold()).setBorder(null).setTextAlignment(TextAlignment.RIGHT));
        totalTable.addCell(new Cell().add(new Paragraph(formatCurrency(order.getPartsCost()))).setBorder(null));
        totalTable.addCell(new Cell().add(new Paragraph("TOTAL:").setBold().setFontSize(14)).setBorder(null).setTextAlignment(TextAlignment.RIGHT));
        totalTable.addCell(new Cell().add(new Paragraph(formatCurrency(order.getTotal())).setBold().setFontSize(14).setFontColor(BLUE_COLOR)).setBorder(null));
        document.add(totalTable);

        // Technical Notes
        if (order.getTechnicianNotes() != null && !order.getTechnicianNotes().isEmpty()) {
            document.add(new Paragraph("\n"));
            document.add(new Paragraph("Observações Técnicas:").setBold().setFontSize(12));
            document.add(new Paragraph(order.getTechnicianNotes()).setFontColor(GRAY_COLOR));
        }

        // Footer
        document.add(new Paragraph("\n\n"));
        document.add(new Paragraph("Documento gerado em " + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                .setFontSize(8)
                .setFontColor(GRAY_COLOR)
                .setTextAlignment(TextAlignment.CENTER));

        document.close();
        return baos.toByteArray();
    }

    private void addInfoRow(Table table, String label, String value) {
        table.addCell(new Cell().add(new Paragraph(label).setBold()).setBorder(null));
        table.addCell(new Cell().add(new Paragraph(value)).setBorder(null));
    }

    private void addHeaderCell(Table table, String text) {
        Cell cell = new Cell().add(new Paragraph(text).setBold().setFontColor(ColorConstants.WHITE));
        cell.setBackgroundColor(BLUE_COLOR);
        table.addHeaderCell(cell);
    }

    private String formatCurrency(BigDecimal value) {
        return CURRENCY_FORMAT.format(value);
    }

    private String getStatusLabel(String status) {
        return switch (status) {
            case "DRAFT" -> "Rascunho";
            case "SENT" -> "Enviado";
            case "APPROVED" -> "Aprovado";
            case "REJECTED" -> "Rejeitado";
            case "PENDING" -> "Pendente";
            case "IN_PROGRESS" -> "Em Andamento";
            case "PAUSED" -> "Pausado";
            case "COMPLETED" -> "Concluído";
            case "CANCELLED" -> "Cancelado";
            case "PAID" -> "Pago";
            default -> status;
        };
    }

    public byte[] generateSalePdf(Sale sale) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // Header
        Paragraph title = new Paragraph("VENDA #" + sale.getId())
                .setFontSize(24)
                .setBold()
                .setFontColor(BLUE_COLOR)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(title);

        document.add(new Paragraph("\n"));

        // Customer Info
        Table infoTable = new Table(2).useAllAvailableWidth();
        addInfoRow(infoTable, "Cliente:", sale.getCustomerName());
        addInfoRow(infoTable, "Data da Venda:", sale.getSaleDate().format(DATE_FORMAT));
        addInfoRow(infoTable, "Status:", getStatusLabel(sale.getStatus().name()));
        document.add(infoTable);

        document.add(new Paragraph("\n"));

        // Items Table
        Paragraph itemsTitle = new Paragraph("Itens da Venda")
                .setFontSize(16)
                .setBold()
                .setFontColor(BLUE_COLOR);
        document.add(itemsTitle);

        Table itemsTable = new Table(new float[]{4, 1, 1, 1, 2}).useAllAvailableWidth();
        itemsTable.setMarginTop(10);

        // Headers
        addHeaderCell(itemsTable, "Descrição");
        addHeaderCell(itemsTable, "Unidade");
        addHeaderCell(itemsTable, "Qtd");
        addHeaderCell(itemsTable, "Valor Unit.");
        addHeaderCell(itemsTable, "Total");

        // Items
        for (SaleItem item : sale.getItems()) {
            itemsTable.addCell(new Cell().add(new Paragraph(item.getDescription())));
            itemsTable.addCell(new Cell().add(new Paragraph(item.getUnit())));
            itemsTable.addCell(new Cell().add(new Paragraph(String.valueOf(item.getQuantity()))));
            itemsTable.addCell(new Cell().add(new Paragraph(formatCurrency(item.getUnitPrice()))));
            itemsTable.addCell(new Cell().add(new Paragraph(formatCurrency(item.getTotal()))).setBold());
        }

        document.add(itemsTable);

        // Total
        document.add(new Paragraph("\n"));
        Table totalTable = new Table(2).useAllAvailableWidth();
        totalTable.addCell(new Cell().add(new Paragraph("TOTAL").setBold().setFontSize(14)).setBorder(null).setTextAlignment(TextAlignment.RIGHT));
        totalTable.addCell(new Cell().add(new Paragraph(formatCurrency(sale.getTotal())).setBold().setFontSize(14).setFontColor(BLUE_COLOR)).setBorder(null));
        document.add(totalTable);

        // Notes
        if (sale.getNotes() != null && !sale.getNotes().isEmpty()) {
            document.add(new Paragraph("\n"));
            document.add(new Paragraph("Observações:").setBold().setFontSize(12));
            document.add(new Paragraph(sale.getNotes()).setFontColor(GRAY_COLOR));
        }

        // Footer
        document.add(new Paragraph("\n\n"));
        document.add(new Paragraph("Documento gerado em " + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                .setFontSize(8)
                .setFontColor(GRAY_COLOR)
                .setTextAlignment(TextAlignment.CENTER));

        document.close();
        return baos.toByteArray();
    }
}
