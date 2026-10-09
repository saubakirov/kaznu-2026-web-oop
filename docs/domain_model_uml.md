# Модель предметной области Avtobys (UML Диаграммы)

Настоящий документ содержит спецификацию ключевых сущностей, отношений и паттернов сквозного кейса **Avtobys**, используемого в курсе ООП.

## 1. Диаграмма классов: Неделя 1 (Базовая объектная модель)

```mermaid
classDiagram
    class Passenger {
        +str passenger_id
        +str name
        +TransitCard card
        +tap_card(Validator validator) RideResult
    }

    class TransitCard {
        +str card_number
        -int balance
        +bool is_blocked
        +get_balance() int
        +top_up(int amount) void
        +deduct(int amount) bool
        +block() void
    }

    class TariffPolicy {
        <<interface>>
        +calculate_fare(Passenger passenger, int base_price) int
    }

    class StandardTariff {
        +calculate_fare(Passenger passenger, int base_price) int
    }

    class StudentTariff {
        +calculate_fare(Passenger passenger, int base_price) int
    }

    class Validator {
        +str validator_id
        +str bus_id
        +int base_fare
        +TariffPolicy tariff_policy
        +process_tap(TransitCard card) RideReceipt
    }

    Passenger *-- TransitCard : owns (Composition)
    Validator o-- TariffPolicy : uses (Aggregation)
    TariffPolicy <|.. StandardTariff : implements
    TariffPolicy <|.. StudentTariff : implements
```

## 2. Диаграмма классов: Неделя 2 (Принципы SOLID и DI)

```mermaid
classDiagram
    class IPaymentGateway {
        <<interface>>
        +charge(str card_number, int amount) bool
    }

    class InternalCardGateway {
        +charge(str card_number, int amount) bool
    }

    class BankApiGateway {
        +charge(str card_number, int amount) bool
    }

    class IFareCalculator {
        <<interface>>
        +get_amount(str ride_context) int
    }

    class PaymentProcessor {
        -IPaymentGateway gateway
        -IFareCalculator calculator
        +process_payment(TransitCard card, str context) PaymentResult
    }

    PaymentProcessor o-- IPaymentGateway : DIP (depends on abstraction)
    PaymentProcessor o-- IFareCalculator : DIP
    IPaymentGateway <|.. InternalCardGateway : implements
    IPaymentGateway <|.. BankApiGateway : implements
```

## 3. Диаграмма классов: Неделя 3 (Паттерны проектирования GoF)

```mermaid
classDiagram
    class ITransactionObserver {
        <<interface>>
        +on_transaction(Transaction tx) void
    }

    class FraudMonitoringObserver {
        +on_transaction(Transaction tx) void
    }

    class TelemetryObserver {
        +on_transaction(Transaction tx) void
    }

    class ValidationHandler {
        <<abstract>>
        -ValidationHandler next_handler
        +set_next(ValidationHandler handler) ValidationHandler
        +validate(RideRequest req) bool
    }

    class BalanceCheckHandler {
        +validate(RideRequest req) bool
    }

    class StopListCheckHandler {
        +validate(RideRequest req) bool
    }

    ITransactionObserver <|.. FraudMonitoringObserver : Observer
    ITransactionObserver <|.. TelemetryObserver : Observer
    ValidationHandler <|-- BalanceCheckHandler : Chain of Responsibility
    ValidationHandler <|-- StopListCheckHandler : Chain of Responsibility
```
