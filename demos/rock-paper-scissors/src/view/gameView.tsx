import { GameState } from '../model/model';

export type GameViewProps = {
    gameState: GameState;
}

export const GameView = ({ gameState }: GameViewProps) => {
    return <div><p>{gameState.state}</p></div>
}
