import {Link} from 'react-router-dom'
import {ListGroupItem} from "reactstrap";
import {PropsWithChildren} from "react";

interface MenuItemProps {
    to: string
}

export const MenuItem: React.FC<PropsWithChildren & MenuItemProps> = (props) => (
<ListGroupItem>
    <Link to={`/${props.to}`}>
    <div style={{padding: 10, fontSize: '1.3em'}}>
        {props.children}
    </div>
    </Link>
</ListGroupItem>
)