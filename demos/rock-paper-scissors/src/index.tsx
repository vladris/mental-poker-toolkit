import { ITransport } from "@mental-poker-toolkit/types";
import { getLedger } from "@mental-poker-toolkit/demo-transport";
import ReactDOM from "react-dom/client";

type MainViewProps = { transport: ITransport<unknown> }

function MainView(props: MainViewProps) {
    const { transport } = props;

    return (<div style={{ display: "flex" }}>
        <div>
            <p>Hello world!</p>
        </div>
    </div>)
}

getLedger().then((ledger) => {
    const root = ReactDOM.createRoot(document.getElementById("root")!);
    
    root.render(
        <MainView transport={ledger}></MainView>
    );
});
