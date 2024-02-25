import { PlaySelection } from "./model";

export type ButtonsViewProps = {
    disabled: boolean;
    onPlay: (play: PlaySelection) => void;
}

export const ButtonsView = ({ disabled, onPlay }: ButtonsViewProps) => {
    return <div>
        <button disabled={disabled} onClick={() => onPlay("Rock")} style={{ width: 200}}>🪨</button>
        <button disabled={disabled} onClick={() => onPlay("Paper")} style={{ width: 200 }}>📄</button>
        <button disabled={disabled} onClick={() => onPlay("Scissors")} style={{ width: 200 }}>✂️</button>
    </div>
}