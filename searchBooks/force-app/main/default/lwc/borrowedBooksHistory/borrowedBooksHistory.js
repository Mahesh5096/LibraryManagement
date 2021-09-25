import { LightningElement,wire } from 'lwc';
//import getBorrowedBooks from '@salesforce/apex/customSearchSobjectLWC.getBorrowedBooks';
import USER_ID from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import USER_NAME from '@salesforce/schema/User.Name';
import { refreshApex } from '@salesforce/apex';
import getBookByIdSOSL from '@salesforce/apex/customSearchSobjectLWC.getBookByIdSOSL';


const columns = [
    {label: 'Book Id', fieldName: 'Book_Id__c', type: 'text', sortable: "true"},
    {label: 'Book Name', fieldName: 'Book_Name__c', type: 'text', sortable:true, initialWidth: 400},
    {label: 'Author', fieldName: 'Author__c', type: 'text', sortable: "true"},
    {label: 'Borrowed Date', fieldName: 'Borrowed_date__c', type: 'text', sortable: "true"},
    {label: 'Returned date', fieldName: 'Returned_date__c', type: 'text', sortable: "true"}
];

export default class BorrowedBooksHistory extends LightningElement {
    searchKey='';
    loggedInUserId=USER_ID;
    loggedInUserName;
    columns = columns;
    sortDirection;
    sortBy;
    record;
    error;
    wireddataResult;
    recordLength=0;

    @wire(getRecord, {
        recordId: USER_ID,
        fields: [USER_NAME]
    }) wireuser({
        error,
        data
    }) {
        if (error) {
           this.error = error ;
           console.log('-->error');
           console.log(this.error); 

        } else if (data) {
            console.log('--->id'+USER_ID);
            this.loggedInUserName = data.fields.Name.value;
        }
    }

    get dynamicGreeting(){
        if(this.loggedInUserName!=undefined){
        return `Hello ${this.loggedInUserName.toUpperCase()}!`;
        }
    }

    @wire(getBookByIdSOSL,{userId:'$loggedInUserId',searchKey:'$searchKey'}) wiredbooks(result){
        this.wireddataResult = result;
        if(result.data){
            this.record = result.data;
            this.recordLength = this.record.length;
        }
        console.log('-->wire')
        console.log(result.data);
        return refreshApex(this.wireddataResult);
    }
    
    handleSearch(event){
        window.clearTimeout(this.delayTimeout);
        const searchKey = event.target.value;
        this.delayTimeout = setTimeout(() => {
            this.searchKey = searchKey;
        }, 300);
    }
   
    doSorting(event){
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy,this.sortDirection);
    }

    sortData(fieldName,direction){
        let parseDate = JSON.parse(JSON.stringify(this.record));
        let keyValue = (a) =>{
            return a[fieldName];
        };

        let isReverse = direction ==='asc'?1:-1;
        parseDate.sort((x,y)=>{
            x = keyValue(x)?keyValue(x):'';
            y = keyValue(y)?keyValue(y):'';
            return isReverse*((x>y)-(y>x));
        });
        this.record = parseDate;
        this.recordLength = this.record.length;
    }

//#region  commanted line

    //     connectedCallback(){
    //         console.log(this.loggedInUserId);
    //         getBorrowedBooks({
    //             userId:this.loggedInUserId
    //         })
    //         .then(result=>{
    //             this.record = result;
    //             this.recordLength = this.record.length;
    //         })
    //         .catch(error=>{
    //             this.error = error.message
    //             console.log(this.error);
    //         })
    //     }

    // @wire(getBorrowedBooks,{userId:'$loggedInUserId'}) wiredBorrowedBooks(result){
    //     this.wireddataResult = result;
    //     if(result.data){
    //         this.record = result.data;
    //         this.recordLength = this.record.length;
    //     }
    //     return refreshApex(this.wireddataResult);
    // }

    // this.searchKey = 
        //     getBookByIdSOSL({
        //         searchKey:this.searchKey
        //     })
        //     .then(result=>{
        //         this.record = result;
        //         this.recordLength = this.record.length;
        //     })
        //     .catch(error=>{
        //         this.error = error.message
        //         console.log(this.error);
        //     })

//#endregion

}