

export function getDate(){
    let today = new Date(); 
    const options = { weekday: 'long', month: 'long', day: 'numeric' }; 
    let currentDay = today.toLocaleDateString("nb", options);
    
    return currentDay;
}
