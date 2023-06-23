// Contains current player state in game.
export class State {
    static WAITING = new State("WAITING");
    static ANGLE_CHOOSE = new State("ANGLE");
    static SPEED_CHOOSE = new State("SPEED");

    constructor(name) {
        this.name = name;
    }
} // End of State class.

// Contains room data.
export class Data {
    constructor() {
        this.roomId = null;    // Current room ID.
        this.playerId = null;  // Current player ID.
        this.position = null;  // Current player position.
        this.side = "n";       // Current player map side.
        this.state = null;     // Current player state.
        this.speed = 0;        // Current player bullet speed.
        this.isShot = false;   // Current player shot draw flag.
        this.startShot = 0;    // Current player shot start time.
        this.ePos = null;      // Enemy position in room.
        this.eSpeed = 0;       // Enemy bullet speed.
        this.eSinAngle = null; // Enemy sin angle.
        this.eCosAngle = null; // Enemy cos angle.
        this.eIsShot = false;  // Enemy shot draw flag.
        this.eStartShot = 0;   // Enemy shot start time.
    }

    setAngle(mouseX, mouseY) {
        // Sin
        this.sinAngle = (mouseY - (this.position[1] + 10)) /
        Math.sqrt((mouseX - (this.position[0] + 10)) ** 2 + (mouseY - (this.position[1] + 10)) ** 2);
        // Cos
        this.cosAngle = (mouseX - (this.position[0] + 10)) /
        Math.sqrt((mouseX - (this.position[0] + 10)) ** 2 + (mouseY - (this.position[1] + 10)) ** 2);
    }
} // End of Data class.
