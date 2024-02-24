import { PlaySelection } from "./model";

export type ButtonsViewProps = {
    onPlay: (play: PlaySelection) => void;
}

export const ButtonsView = ({ onPlay }: ButtonsViewProps) => {
    return <div>
        <button onClick={() => onPlay("Rock")} style={{ width: 200}}>🪨</button>
        <button onClick={() => onPlay("Paper")} style={{ width: 200 }}>📄</button>
        <button onClick={() => onPlay("Scissors")} style={{ width: 200 }}>✂️</button>
    </div>
}