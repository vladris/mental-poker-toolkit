import { CardView } from "./cardView"

export type HandViewProps = {
    key: string;
    cards: (string | undefined)[];
};

export const HandView: React.FC<HandViewProps> = ({ cards, key }) => {
    return <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>{
            cards.map((card, i) => <CardView key={key + ":" + i} card={ card } />)
        }
    </div>
}
