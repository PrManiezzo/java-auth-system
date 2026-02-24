# 💰 APIs de Nota Fiscal - Comparativo de Preços

**Atualizado:** Fevereiro 2026

## 🎯 Opções Mais Econômicas

### 1. **NFe.io** ⭐ RECOMENDADO
- **Gratuito:** Até 10 notas/mês
- **Pago:** A partir de R$ 0,10/nota
- **Recursos:**
  - NFe, NFCe, NFSe
  - Ambiente de homologação ilimitado
  - API REST completa
  - Dashboard intuitivo
  - Webhook para eventos
  - Impressão de DANFE
- **Site:** https://nfe.io
- **Documentação:** https://nfe.io/docs

### 2. **PlugNotas**
- **Gratuito:** Até 5 notas/mês
- **Pago:** A partir de R$ 0,25/nota
- **Recursos:**
  - NFe, NFCe, NFSe, CTe, MDFe
  - Consulta de notas
  - Manifesto de destinatário
  - DANFE e XML
- **Site:** https://plugnotas.com.br
- **Documentação:** https://docs.plugnotas.com.br

### 3. **Focus NFe** 
- **Gratuito:** 50 notas em homologação
- **Pago:** A partir de R$ 0,30/nota
- **Recursos:**
  - NFe, NFCe, NFSe, CTe, MDFe
  - Inutilização e cancelamento
  - Carta de correção
  - Consulta cadastro
- **Site:** https://focusnfe.com.br
- **Documentação:** https://focusnfe.com.br/documentacao

### 4. **eNotas** 
- **Gratuito:** Até 3 notas/mês
- **Pago:** A partir de R$ 0,40/nota
- **Recursos:**
  - NFe, NFCe, NFSe
  - Gestão de boletos
  - Cobrança recorrente
  - Integração bancária
- **Site:** https://enotas.com.br
- **Documentação:** https://enotas.com.br/documentacao

### 5. **WebmaniaBR**
- **Gratuito:** Não
- **Pago:** A partir de R$ 0,49/nota
- **Recursos:**
  - NFe, NFCe
  - Certificado A1 incluso
  - Suporte por email
- **Site:** https://webmaniabr.com
- **Documentação:** https://webmaniabr.com/docs/nfe

---

## 🏆 Melhor Custo-Benefício: **NFe.io**

### Por que NFe.io?

✅ **10 notas gratuitas/mês** - Ideal para começar  
✅ **R$ 0,10/nota** - Mais barato do mercado  
✅ **API completa e bem documentada**  
✅ **Suporte ativo**  
✅ **Dashboard moderno**  
✅ **Webhook para automação**  
✅ **Ambiente de homologação ilimitado**  

---

## 📦 Solução Open Source: **java-nfe**

### Biblioteca Java para NFe
- **Gratuito:** Totalmente open source
- **Repositório:** https://github.com/wmixvideo/nfe
- **Recursos:**
  - Gera XML da NFe/NFCe
  - Assina com certificado A1
  - Envia para SEFAZ
  - Consulta status
  - Imprime DANFE
- **Custo:** R$ 0 (apenas certificado digital A1 ~R$ 150/ano)
- **Vantagem:** Controle total, sem custo por nota
- **Desvantagem:** Requer expertise técnica

---

## 💡 Recomendação Final

### Para este projeto:

1. **Início (desenvolvimento):** 
   - **NFe.io** (10 notas gratuitas/mês)
   - Teste em ambiente de homologação (ilimitado)

2. **Crescimento (até 100 notas/mês):**
   - **NFe.io** (R$ 10/mês para 100 notas)

3. **Escalabilidade (mais de 500 notas/mês):**
   - Considerar **java-nfe** (open source)
   - Custo fixo apenas certificado digital

---

## 🔧 Implementação Simplificada

### Com NFe.io API:

```java
// 1. Cadastrar empresa
POST https://api.nfe.io/v1/companies

// 2. Emitir NFe
POST https://api.nfe.io/v1/companies/{id}/nfes

// 3. Consultar status
GET https://api.nfe.io/v1/companies/{id}/nfes/{nfe_id}

// 4. Baixar DANFE
GET https://api.nfe.io/v1/companies/{id}/nfes/{nfe_id}/pdf

// 5. Cancelar NFe
DELETE https://api.nfe.io/v1/companies/{id}/nfes/{nfe_id}
```

### Payload Simplificado:

```json
{
  "customer": {
    "federalTaxNumber": "07504505000132",
    "name": "João Silva",
    "email": "joao@email.com",
    "address": {
      "street": "Rua das Flores",
      "number": "123",
      "district": "Centro",
      "city": "São Paulo",
      "state": "SP",
      "postalCode": "01310-100"
    }
  },
  "items": [
    {
      "code": "001",
      "description": "Produto Teste",
      "quantity": 1,
      "unitPrice": 100.00,
      "ncm": "12345678"
    }
  ]
}
```

---

## 📋 Checklist de Requisitos

Antes de emitir notas, você precisa:

- [ ] Certificado Digital A1 (R$ 150-300/ano)
- [ ] CNPJ ativo
- [ ] Inscrição Estadual (IE)
- [ ] Cadastro na SEFAZ do seu estado
- [ ] Autorização para emissão de NFe
- [ ] Série da NFe configurada
- [ ] Numeração inicial definida

---

## 🚀 Próximos Passos

1. Criar conta gratuita na NFe.io
2. Testar emissão em homologação
3. Integrar API no backend
4. Criar tela de configurações fiscais
5. Implementar fluxo de emissão
6. Testar com clientes reais (homologação)
7. Ativar ambiente de produção
