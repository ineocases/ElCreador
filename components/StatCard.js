export default function Stat(icon,value,label){

    return`

    <div class="stat">

        ${icon}

        <span>${value}</span>

        <small>${label}</small>

    </div>

    `;

}
