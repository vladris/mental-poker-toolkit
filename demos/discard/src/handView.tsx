import { CardView } from "./cardView"

export type HandViewProps = {
    prefix: string;
    cards: (string | undefined)[];
    onClick?: (index: number) => void;
};

export const HandView: React.FC<HandViewProps> = ({ cards, prefix, onClick }) => {
    return <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>{
            cards.map((card, i) => <CardView key={prefix + ":" + i} card={ card } onClick={() => { if (onClick) { onClick(i) } }} />)
        }
    </div>
}
