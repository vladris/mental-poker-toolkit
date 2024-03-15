export type CardViewProps = {
    card: string | undefined;
    onClick?: () => void;
};

const suiteMap = new Map([
    ["hearts", "♥"],
    ["diamonds", "♦"],
    ["clubs", "♣"],
    ["spades", "♠"]
]);

export const CardView: React.FC<CardViewProps> = ({ card, onClick }) => {
    const number = card?.split(":")[0];
    const suite = card ? suiteMap.get(card.split(":")[1]) : undefined;
    const color = suite === "♥" || suite === "♦" ? "red" : "black";

    return <div style={{ width: 70, height: 100, borderColor: "black", borderWidth: 1, borderStyle: "solid", borderRadius: 5, 
                    backgroundColor: card ? "white" : "darkred"}} onClick={onClick}>
        <div style={{ display: card ? "block" : "none", paddingLeft: 15, paddingRight: 15, color }}>
            <p style={{ marginTop: 20, marginBottom: 0, textAlign: "left", fontSize: 25 }}>{number}</p>
            <p style={{ marginTop: 0, textAlign: "right", fontSize: 30 }}>{suite}</p>
        </div>
    </div>
}
