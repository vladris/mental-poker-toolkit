import { Play } from "@/model/model";

export type ButtonsViewProps = {
    onPlay: (play: Play) => void;
}

export const ButtonsView = ({ onPlay }: ButtonsViewProps) => {
    return <div>
        <button onClick={() => onPlay(Play.Rock)}>🪨</button>
        <button onClick={() => onPlay(Play.Paper)}>📄</button>
        <button onClick={() => onPlay(Play.Scissors)}>✂️</button>
    </div>
}
