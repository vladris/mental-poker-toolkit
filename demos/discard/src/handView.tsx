import { CardView } from "./cardView"

export type HandViewProps = {
    cards: (string | undefined)[];
};

export const HandView: React.FC<HandViewProps> = ({ cards }) => {
    return <div>{
            cards.map((card) => <CardView card={ card } />)
        }
    </div>
}
