export function save(key,data){

    localStorage.setItem(

        key,

        JSON.stringify(data)

    );

}

export function load(key){

    const data=localStorage.getItem(key);

    if(!data) return null;

    return JSON.parse(data);

}
