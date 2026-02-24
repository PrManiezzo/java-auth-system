import type { StockMovement } from "./FinanceContext";

type StockMovementsSectionProps = {
    movements: StockMovement[];
};

export default function StockMovementsSection({ movements }: StockMovementsSectionProps) {
    return (
        <section className="finance-card" id="movimentos">
            <div className="section-header">
                <h2>Movimentos de estoque</h2>
                <span>{movements.length} registros</span>
            </div>
            <div className="list">
                {movements.map((movement) => (
                    <div key={movement.id} className="list-row">
                        <strong>{movement.itemName}</strong>
                        <span>{movement.type}</span>
                        <span>{movement.quantity}</span>
                        <span>{movement.reason || "-"}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
