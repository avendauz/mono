import {MenuItem} from "./MenuItem";
import {ListGroup} from "reactstrap";

export const Menu: React.FC = () => (
    <ListGroup>
        <MenuItem to="compass">Compass</MenuItem>
        <MenuItem to="autopilot">Autopilot</MenuItem>
        <MenuItem to="engine">Engine</MenuItem>
    </ListGroup>
)