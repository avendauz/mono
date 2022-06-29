import {PropsWithChildren} from "react";

export const RedGreen: React.FC<PropsWithChildren> = (props) => (
    <span style={{color: getColor(parseFloat(props.children as string))}}>
        {props.children}
    </span>
);

const getColor = (n: number): string =>
    n < 0 ? 'red' : n > 0 ? 'green' : 'black';