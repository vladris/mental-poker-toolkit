export type CardViewProps = {
    card: string | undefined;
};

export const CardView: React.FC<CardViewProps> = ({ card }) => {
    return <div>
        <p>{card ?? "Back"}</p>
    </div>
}
