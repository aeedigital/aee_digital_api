# Feature Specification: Atualização dos dados do centro por summary

**Feature Branch**: `feature/update-centro-info`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "Quero que quando uma nova summary for enviada os dados de contato, funcionamento e localizacao sejam atualizados na tabela de centros que hoje em dia é um resumo geral"

## Clarifications

### Session 2026-11-20

- Q: Quais informações da summary devem atualizar os dados gerais do centro? → A: Todos os valores válidos já classificados como contato, funcionamento ou localização na summary.
- Q: A atualização automática de contatos deve seguir a regra do script de reconciliação, removendo telefone e site quando não houver autorização ou valor válido na summary mais recente? → A: Sim. Exigir autorização positiva e remover os contatos públicos sem autorização ou valor válido.
- Q: Quando uma summary trouxer um endereço novo, a funcionalidade também deve recalcular as coordenadas geográficas do centro? → A: Sim. Atualizar o endereço e recalcular as coordenadas automaticamente.
- Q: Quando a atualização assíncrona começar, como você quer que o envio da summary informe o resultado ao usuário? → A: Responder após aceitar a summary, sem disponibilizar um estado consultável da atualização.
- Q: Antes de remover a busca de funcionamento na summary, devemos preencher o funcionamento dos centros existentes a partir de suas summaries atuais? → A: Não. Atualizar somente centros após novos envios de summary.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Atualizar o resumo geral do centro (Priority: P1)

Uma pessoa envia uma nova summary com informações de contato, funcionamento e/ou localização de um centro. O envio é confirmado sem esperar pela atualização em segundo plano; depois que o processamento termina com sucesso, essas informações aparecem no registro geral do mesmo centro.

**Why this priority**: O registro geral do centro deve refletir as informações atuais fornecidas nas summaries, evitando que pessoas consultem dados desatualizados.

**Independent Test**: Enviar uma summary válida com valores diferentes dos atuais, aguardar a conclusão do processamento em segundo plano e consultar o registro geral do centro; os dados enviados devem estar refletidos nas categorias correspondentes.

**Acceptance Scenarios**:

1. **Given** um centro com dados gerais existentes, **When** o processamento de uma nova summary aceita termina com sucesso, **Then** o registro geral do mesmo centro reflete os valores válidos de contato, funcionamento ou localização.
2. **Given** uma nova summary aceita contém informação válida para apenas algumas dessas categorias, **When** o registro geral do centro é consultado, **Then** as categorias informadas são atualizadas e as categorias não relacionadas a contatos que estejam ausentes mantêm os valores anteriores.
3. **Given** a summary mais recente não autoriza a divulgação de contatos, **When** seu processamento termina, **Then** telefone e site deixam de constar como contatos públicos no registro geral do centro.
4. **Given** a summary mais recente autoriza a divulgação, mas um dos contatos não tem valor válido, **When** seu processamento termina, **Then** esse contato deixa de constar no registro geral, enquanto os contatos válidos são atualizados.
5. **Given** uma summary não é aceita, **When** o envio falha, **Then** ela não altera os dados gerais do centro.
6. **Given** uma summary aceita atualiza esses dados, **When** o registro geral é consultado, **Then** os demais dados do centro que não pertencem a contato, funcionamento ou localização permanecem inalterados.
7. **Given** uma summary aceita altera o endereço, **When** o processamento é concluído com sucesso, **Then** as coordenadas geográficas refletem o novo endereço.
8. **Given** uma summary aceita altera o endereço, **When** não é possível determinar as novas coordenadas, **Then** o endereço permanece atualizado e o resultado geográfico não é apresentado como confirmado para o endereço anterior.
9. **Given** uma summary foi aceita, **When** o processamento dos dados do centro ainda está em andamento, **Then** a confirmação do envio já foi devolvida e o usuário não precisa consultar um estado de processamento.
10. **Given** o processamento em segundo plano falha, **When** o envio já foi confirmado, **Then** a falha é registrada para tratamento operacional sem apresentar a atualização como concluída.
11. **Given** um centro existente ainda não recebeu uma nova summary após a ativação da funcionalidade, **When** seus dados são consultados, **Then** o funcionamento não é buscado em summaries antigas e só está disponível se já estiver persistido no registro do centro.

### Edge Cases

- Endereço ausente, não respondido ou vazio: preservar o endereço atual.
- Funcionamento ausente ou sem valor válido: preservar o valor atual.
- Telefone ou site sem valor válido na summary mais recente: remover esse contato do registro geral.
- Summary sem autorização positiva para divulgação: remover telefone e site do registro geral.
- Endereço novo sem resultado geográfico confirmado: manter o endereço informado e sinalizar que a localização geográfica precisa de atualização.
- O processamento em segundo plano falha após a confirmação do envio: registrar a falha para tratamento operacional; não oferecer um estado consultável ao usuário.
- Um centro antigo ainda não recebeu nova summary e seu funcionamento não está persistido: não buscar o valor em summaries anteriores.
- A summary é aceita sem informações sobre as categorias abrangidas: não alterar o registro geral do centro.
- A summary não é aceita: não atualizar nenhuma categoria no registro geral.
- A summary atualiza apenas um centro: não alterar dados gerais de outros centros.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Após processar uma nova summary aceita associada a um centro, o sistema MUST atualizar o registro geral desse mesmo centro com todos os valores válidos da summary classificados como contato, funcionamento ou localização.
- **FR-002**: Para endereço e funcionamento, o sistema MUST atualizar somente os valores válidos fornecidos na summary; para contatos públicos, o sistema MUST seguir a regra específica de autorização e remoção definida em FR-008 e FR-009.
- **FR-003**: O sistema MUST preservar os valores atuais de endereço e funcionamento quando a summary não fornecer um valor válido para essas categorias.
- **FR-004**: O sistema MUST preservar os demais dados do centro que não sejam de contato, funcionamento ou localização.
- **FR-005**: O sistema MUST NOT alterar dados gerais do centro quando a summary não for aceita.
- **FR-006**: As alterações MUST ser associadas exclusivamente ao centro identificado pela summary.
- **FR-007**: Após a conclusão bem-sucedida do processamento em segundo plano, uma consulta subsequente ao registro geral do centro MUST apresentar os valores válidos atualizados.
- **FR-008**: O sistema MUST publicar telefone e site somente quando a summary mais recente autorizar positivamente a divulgação.
- **FR-009**: Quando a summary mais recente não autorizar a divulgação, o sistema MUST remover telefone e site do registro geral; quando autorizar, MUST remover cada contato sem valor válido e atualizar os contatos com valores válidos.
- **FR-010**: Quando um endereço válido for atualizado, o sistema MUST recalcular automaticamente as coordenadas geográficas correspondentes.
- **FR-011**: Se não for possível calcular novas coordenadas, o sistema MUST manter o endereço atualizado e MUST NOT apresentar as coordenadas anteriores como confirmadas para esse endereço.
- **FR-012**: Depois que uma summary for aceita, o sistema MUST confirmar o envio sem esperar que a atualização do centro e o recálculo geográfico terminem.
- **FR-013**: O sistema MUST NOT exigir nem disponibilizar ao usuário uma consulta de estado para acompanhar esse processamento em segundo plano.
- **FR-014**: Falhas no processamento em segundo plano MUST ser registradas para tratamento operacional e MUST NOT ser apresentadas como atualização concluída.
- **FR-015**: Durante o processamento em segundo plano de uma nova summary aceita, o sistema MUST persistir no registro do centro os valores válidos de funcionamento presentes na summary.
- **FR-016**: As consultas do registro geral do centro MUST obter o funcionamento do próprio registro do centro e MUST NOT buscar esse dado em summaries.
- **FR-017**: O sistema MUST NOT preencher em lote os valores de funcionamento de centros existentes a partir de summaries anteriores; um centro sem funcionamento persistido só recebe esse dado após o processamento de uma nova summary válida.

### Key Entities *(include if feature involves data)*

- **Summary**: Conjunto de informações enviado sobre um centro, incluindo respostas que podem atualizar contato, funcionamento e localização.
- **Centro**: Registro geral que reúne os dados atuais de um centro, incluindo telefone, site, endereço, funcionamento, localização geográfica e outras informações que esta funcionalidade não deve alterar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos processamentos concluídos com sucesso, uma consulta posterior do centro apresenta os valores válidos da summary aceita.
- **SC-002**: Em 100% dos casos em que endereço ou funcionamento está ausente, vazio ou inválido, seu valor anterior permanece inalterado.
- **SC-003**: Em 100% dos casos testados, dados de outros centros e dados do centro fora das três categorias abrangidas permanecem inalterados.
- **SC-004**: Nenhum envio de summary não aceito altera os dados gerais do centro.
- **SC-005**: Em 100% dos casos testados, telefone e site só permanecem visíveis quando autorizados e respaldados por valores válidos na summary mais recente.
- **SC-006**: Em 100% das alterações válidas de endereço, a localização geográfica é recalculada ou apresentada como pendente/não confirmada, sem atribuir confirmação ao endereço anterior.
- **SC-007**: Em 100% dos envios aceitos, a confirmação é devolvida sem esperar pela atualização dos dados do centro nem pelo recálculo geográfico.
- **SC-008**: Em 100% dos processamentos bem-sucedidos de novas summaries com funcionamento válido, o valor fica disponível no registro geral do centro sem consulta à summary.

## Assumptions

- As informações de contato, funcionamento e localização são obtidas das respostas enviadas na summary associada ao centro.
- Todos os valores válidos já classificados nessas três categorias são abrangidos; a funcionalidade não se limita a campos de exemplo como telefone, horário ou endereço.
- A atualização de contatos segue a regra de divulgação pública: a summary mais recente precisa autorizar positivamente a divulgação; telefone e site sem valores válidos não permanecem publicados.
- Ausência de endereço ou funcionamento válido não apaga os valores existentes. Isso difere da regra para contatos públicos.
- A localização geográfica é distinta do endereço, mas deve ser recalculada automaticamente sempre que um novo endereço válido for salvo.
- Se o cálculo geográfico falhar ou não encontrar resultado, o endereço continua atualizado e a localização não deve aparentar estar confirmada para ele.
- A atualização do centro e o recálculo geográfico ocorrem depois da confirmação do envio; o usuário não consulta o estado do processamento, mas falhas são registradas para tratamento operacional.
- O funcionamento é persistido para novas summaries processadas; centros existentes não são preenchidos retroativamente e não usam summaries antigas como fallback durante consultas.
- A funcionalidade abrange somente as três categorias citadas; os demais dados e comportamentos do centro permanecem fora do escopo.
- Uma summary só pode atualizar os dados gerais depois de ser aceita pelo fluxo de envio existente.
