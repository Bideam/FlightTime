var app=angular.module("myApp",[]);
app.controller("myCtrl",["$scope",function($scope){
    $scope.flightPlan={
        first:"1月21日MF8693厦门0700 0900扬州\n1月21日MF8663扬州1100 2125达曼\n1月22日MF8664达曼0010 0845扬州\n1月22日MF8694扬州1200 1400厦门"
    };
    //机场信息
    $scope.apts=[];
    $scope.flightList=new List();
    //航班时刻表格信息
    $scope.tables=[];
    $scope.initList=function(){
        $scope.nodes=[];

    }
    
    //添加机场节点时，提交或取消按钮动态变化
    $scope.triggerShow=[];
    //新增机场变量
    $scope.addNode={};
    //插入机场时判定变量
    $scope.onlyChange=true;
    //用于插入节点
    //从文本版添加航段时间
    $scope.changeDate=function(){
        var flight = $scope.flightPlan.first.split('\n')
        $scope.apts=[];
        $scope.nodes=[];
        $scope.flightList.head=null;
        $scope.flightList.length=0;
        var dates=[]
        for (let i = 0; i < flight.length; i++) {
            //获取起飞机场/目的机场的名称和时间
            var aptname1=flight[i].substr(11,2);
            var apttime1=flight[i].substr(13,4);
            var aptname2=flight[i].substr(22,2);
            var apttime2=flight[i].substr(18,4);
            var flightNumber=flight[i].substr(5,6);
            $scope.flightList.append(flightToNode(aptname1,apttime1,flightNumber));
            $scope.flightList.append(flightToNode(aptname2,apttime2,flightNumber));
            var obj={name:aptname1,timezone:null,trans:null}
            $scope.apts.push(obj);
            obj={name:aptname2,timezone:null,trans:null}
            $scope.apts.push(obj);
            dates.push(flightToNode(aptname1,apttime1));
            dates.push(flightToNode(aptname2,apttime2));
        }
        $scope.apts=unique($scope.apts);
        //$scope.flightList=initFlight($scope.flightList);
        $scope.initFlight($scope.flightList)
       // console.log($scope.flightList);
        $scope.nodes=[];
        $scope.nodes=$scope.ListToArray($scope.flightList);
        $scope.updateTrigger();
        $scope.updateTable();
    }
    //重置航段
    $scope.clean=function(){
        $scope.apts=[];
        $scope.nodes=[];
        $scope.flightList.clear();
        $scope.updateTable();
    }
    //初始化航班链，计算航班过站时间或航程
    $scope.initFlight=function(list){
        if(list.length==0){
            return null;
        }
        var current=list.head;
        if(!current.next){
            return list;
        }else{
            while(current.next){
                current.trans=calTime(current.pek,current.next.pek);
                current=current.next;
            }
        }
    }
    //将链表转为数组
    $scope.ListToArray=function (list){
        var res=[];
        if (list.length==0) {
            return res;
        }
        var current=list.head;
        while(current.next){
            var obj={
                name:current.name,
                pek:current.pek,
                utc:current.utc,
                loc:current.loc,
                trans:current.trans,
                timezone:current.timezone,
                flightNum:current.flightNum
            }
            res.push(obj);
            current=current.next; 
        }
        if (!current.next) {
            var obj={
                name:current.name,
                pek:current.pek,
                utc:current.utc,
                loc:current.loc,
                trans:current.trans,
                timezone:current.timezone,
                flightNum:current.flightNum
            }
            res.push(obj);
            return res;
        }
    }
    //选择时区
    $scope.changeZone=function(){

        for (let i = 0; i < $scope.apts.length; i++) {
            var apt = $scope.apts[i];
            apt.timezone>12?apt.timezone=12:apt.timezone=apt.timezone;
            apt.timezone<-12?apt.timezone=-12:apt.timezone=apt.timezone;
            var current=$scope.flightList.head;
            for (let j = 0; j < $scope.nodes.length; j++) {

                if (apt.name==$scope.nodes[j].name) {
                    current.timezone=apt.timezone;
                    $scope.nodes[j].timezone=apt.timezone;
                    $scope.nodes[j].loc=varyTime($scope.nodes[j].utc,$scope.nodes[j].timezone);

                }
                current=current.next;
                
            }
        }
    }
    //更改机场过站时间
    $scope.aptTrans=function(index){
            var apt = $scope.apts[index];

            var current=$scope.flightList.head;
            for (let j = 0; j < $scope.nodes.length-1; j++) {
                if (apt.name==$scope.nodes[j].name && apt.name==$scope.nodes[j+1].name) {
                    current.trans=apt.trans;

                    $scope.nodes[j].trans=apt.trans;
                   $scope.updateList();
                }
               current=current.next; 
            }
        
    }
    //检查变化
    $scope.checkedchange=function(){
        if (!$scope.onlyChange) {
            return;
        }
        if ($scope.nodes.length==0) {
            $scope.flightList.head=null;
            $scope.flightList.length=0;
            return
        }
        var current=$scope.flightList.head;
        var prev=null;
        for (let i = 0; i < $scope.nodes.length; i++) {
            var aport = $scope.nodes[i];
            
            if (current.trans!==aport.trans) {
                current.trans=aport.trans;
                $scope.updateList();
                return;
            }else if (current.pek!==aport.pek) {
                current.pek=aport.pek;
                
                current.utc=varyTime(current.pek,-8);
                current.loc=varyTime(current.utc,current.timezone);
                if (!prev) {
                    $scope.updateList();
                    return;
                }else{
                    prev.trans=calTime(prev.pek,current.pek);
                    $scope.updateList();
                }
            }
            prev=current;
            current=current.next;
        }
    }

    //更新链表
    $scope.updateList=function(){
        if ($scope.flightList.length==0) {
            $scope.nodes=[];
            return;
        }
        var current=$scope.flightList.head;
        while(current.next){
            current.next.pek=varyTrans(current.pek,current.trans);
            current.next.utc=varyTime(current.next.pek,-8);
            current.next.loc=varyTime(current.next.utc,current.next.timezone);
            current=current.next;
        }
        $scope.nodes=$scope.ListToArray($scope.flightList);
        $scope.checkedchange()
        $scope.updateTable();

    }
    //更改机场名字
    $scope.changeapt=function(index){
        if ($scope.onlyChange) {
            var obj={name:$scope.nodes[index].name,pek:$scope.nodes[index].pek,timezone:$scope.nodes[index].timezone};
            $scope.apts.push(obj);
            $scope.apts=unique($scope.apts);
            $scope.updateNodesToapts();
            var current=$scope.flightList.head;
            var count=0;
            if (count==index) {
                current.name=$scope.nodes[index].name;
                return;
            }
            while(count<index){
                current=current.next;
                count++;
            }
            current.name=$scope.nodes[index].name;
        }else{
            return;
        }
        

        
    }
    //新增机场节点
    $scope.newNode=function(){
        if (!$scope.addNode.name) {
            alert("请输入机场名称");
            return;
        }
        if ($scope.addNode.pek.indexOf("：")) {
            $scope.addNode.pek.replace("：",":");                        
        }
        if ( $scope.addNode.pek.indexOf(":")>0 && $scope.addNode.pek.length!=5) {
            alert("请输入正确时刻格式，格式如下: XX:XX or XXXX");
            console.log("diyicuowu")
            return
        }else if( $scope.addNode.pek.indexOf(":")<0 && $scope.addNode.pek.length!=4){
            alert("请输入正确时刻格式，格式如下: XX:XX or XXXX");
            console.log("diercuowu")
            return
        }
        var obj={name:$scope.addNode.name,pek:$scope.addNode.pek,timezone:null}
        $scope.apts.push(obj);
        $scope.apts=unique($scope.apts);
        $scope.flightList.append(flightToNode(obj.name,obj.pek));
        $scope.initFlight($scope.flightList);
        $scope.nodes=$scope.ListToArray($scope.flightList);
        $scope.addNode={};
        $scope.updateTable();
    }
    //删除机场节点
    $scope.deleteNode=function(index){
        $scope.flightList.delIndex(index);
        $scope.initFlight($scope.flightList);
        $scope.nodes=$scope.ListToArray($scope.flightList);
        $scope.updateNodesToapts();
        $scope.updateTable();
    }
    //插入机场节点
    $scope.insertNode=function(index){
        $scope.onlyChange=false;
        var apt={name:null,pek:null,};
        $scope.nodes.splice(index+1,0,apt);
        for (let i = 0; i < $scope.nodes.length; i++) {
            var ele = $scope.nodes[i];
            if (!ele.name) {
                $scope.triggerShow[i]=false;
            }else{
                $scope.triggerShow[i]=true;
            }
        }
    }
    //取消插入节点
    $scope.cancel=function(index){
        $scope.onlyChange=true;
        $scope.nodes.splice(index,1);
        $scope.updateTrigger();
    }
    //确认插入机场节点
    $scope.certainInsert=function(index){
        $scope.onlyChange=true;
        if (!$scope.nodes[index].name) {
            alert("请输入机场名称");
            return;
        }
        if ($scope.nodes[index].pek.indexOf("：")) {
            $scope.nodes[index].pek.replace("：",":");                        
        }
        if ( $scope.nodes[index].pek.indexOf(":")>0 && $scope.nodes[index].pek.length!=5) {
            alert("请输入正确时刻格式，格式如下: XX:XX or XXXX");
            console.log("diyicuowu")
            return
        }else if( $scope.nodes[index].pek.indexOf(":")<0 && $scope.nodes[index].pek.length!=4){
            alert("请输入正确时刻格式，格式如下: XX:XX or XXXX");
            console.log("diercuowu")
            return
        }
        var obj={name:$scope.nodes[index].name,pek:$scope.nodes[index].pek,timezone:null}
        $scope.apts.push(obj);
        $scope.apts=unique($scope.apts);
        $scope.flightList.insertIndex(index,flightToNode(obj.name,obj.pek));
        $scope.initFlight($scope.flightList);
        $scope.nodes=$scope.ListToArray($scope.flightList);
        console.log($scope.nodes);
        $scope.updateNodesToapts();
        $scope.updateTrigger();
        $scope.updateTable();
    } 
    //初始化动态“插入，取消”按钮
    $scope.updateTrigger= function (){
        for (let i = 0; i < $scope.nodes.length; i++) {
            var ele=$scope.nodes[i];
            if (!ele.name) {
                $scope.triggerShow[i]=false;
            }else{
                $scope.triggerShow[i]=true;
            }
            
            
        }
    }
    //当有航班节点被删除后,更新机场信息
    $scope.updateNodesToapts=function(){
        for (let i = 0; i < $scope.apts.length; i++) {
            var apt=$scope.apts[i].name;
            var count=0;
            for (let j = 0; j <$scope.nodes.length; j++) {
                if (apt==$scope.nodes[j].name) {
                    count++;
                }
                
            }
            if (count==0) {
                $scope.apts.splice(i,1);
            }
            
        }
    }
    //更新表格数据
    $scope.updateTable=function(){
        $scope.tables=[];
        var initTd=[];
        for (let j = 0; j < 24; j++) {
            initTd=[];
            for (let i = 0; i < $scope.nodes.length; i++) {
                initTd[i] = varyTime($scope.nodes[i].pek,j);
               
           }
           $scope.tables.push(initTd);
        }
        
    
    }
}])
    //自定义循环指令
app.directive('myLi',function(){
    return{
        restrict:'E',
        scope:{
            nodes:"="
        },

        template:'<li class="part" ng-repeat="node in nodes"> \
                    <div class="apt"> \
                        <span>{{node.name}} </span>\
                    </div>\
                    <div class="pek"><span>{{node.pek}} </span> </div>\
                    <div class="utc"><span>{{node.utc}} </span></div>\
                    <div class="loc"><span>{{node.loc}} </span></div>\
                    <div class="next"><span>{{node.next}}</span></div>\
                </li>', 
        replace:true,

    }
})

//机场去重
function unique(arr){
    var temp=[];
        for (let i = 0; i < arr.length; i++) {
            var keys=arr[i];
            var count=0;
            if (temp.length==0) {
                temp.push(keys);
            }else{
                for (let j = 0; j < temp.length; j++) {
                
                    if (temp[j].name==keys.name) {
                        count++
                    }
                    
                }
                if (count==0) {
                    temp.push(keys)
                }
            }  
            
        }
        return temp;
}
//将航班数据转化为节点
function flightToNode(apt,time,flightNumber){
    var name=apt;
    var pek=time.indexOf(':')>0?time:time.substr(0,2)+":"+time.substr(2,2);
    var utc=varyTime(pek,-8);
    var trans="";
    var timezone=null;
    var loc=varyTime("00:00",timezone);
    var res =new Node(name,pek,utc,loc,trans,timezone,flightNumber);
    return res;
}
//通过过站时间机选后段机场时间
function varyTrans(str,mins){
    str=str.split(":")
    var time=parseInt(str[0])*60+parseInt(str[1]);
    time=time+parseInt(mins);
    var res=[]
    res[0]=Math.floor(time/60);
    res[0]>24 || res[0]==24?res[0]=res[0]-24:res[0]=res[0];
    res[0]<10?res[0]="0"+res[0]:res[0]=res[0];
    res[1]=time%60;
    res[1]<10?res[1]="0"+res[1]:res[1]=res[1];

    var temp=res[0]+":"+res[1];
    return temp;
}
//通过时区hour进行转化pek，utc，loc
function varyTime(str,hour){
    if (!hour) {
       return str; 
    }
    hour=parseInt(hour);
    if (hour==0) {
        return str;
    }
    var time=str.split(":");
    var h=parseInt(time[0]);
    var res=h+hour;
    if (res<0) {
        res=24+(res);
    }else if(res>24 || res ==24){
        res=res-24;
    }
    if(res<10){
        res="0"+res+":"+time[1];
    }else{
        res=res+":"+time[1];
    }
    return res

}
//计算过站或航段时间
function calTime(a,b){
    a=a.split(":");
    b=b.split(":");
    a=parseInt(a[0])*60+parseInt(a[1]);
    b=parseInt(b[0])*60+parseInt(b[1]);
    if(b<a){
        b+=24*60;
    }
    return b-a;

}


//
class Node{
    constructor(name,pek,utc,loc,trans,timezone,flightNum){
        this.next=null;
        this.name=name;
        this.pek=pek || null;
        this.utc=utc || null;
        this.loc=loc || null;
        this.trans=trans || null;
        this.timezone=timezone || null;
        this.flightNum=flightNum || null;
    }
}
class List{
    constructor(){
        this.head=null;
        this.length=0;
    }

    static createNode(name){
        return new Node(name);
    }
    append(node){
        if (this.head===null) {
            this.head=node;
            
        }else{
            let current=this.head;
            for (let i = 1; i < this.length; i++) {
                current=current.next;
                
            }
            current.next=node;
        }
        this.length++;
    }
    insert(node){
        if(this.head){
            node.next=this.head;
        }else{
            node.next=null;
        }
        this.head=node;
        this.length++;
    }
    insertIndex(index,node){
        
        if (this.length===0) {
            this.head=node;
        }else {
            var current=this.head;
            if (index==0) {
                this.head=node;
                this.head.next=current; 
                
            }else{
                var count=0;
                var prev=null;
                while(count<index){
                    prev=current;
                    current=current.next;
                    count++;
                }
                node.next=current;
                prev.next=node;
                
            }
            
        }
        this.length++;
    }
    find(name){
        let node=this.head;
        while(node !== null && node.key !== name){
            node=node.next;
        }
        return node;
    }
    delete(node){
        if(this.length===0){
            throw 'node is undefined';
        }
        if (node=== this.head) {
            this.head=node.next;
            this.length--;
            return;
        }
        let prevNode=this.head;
        while(prevNode.next!==node){
            prevNode=prevNode.next;
        }
        if (node.next===null) {
            prevNode.next=null;
        }
        if (node.next) {
            prevNode.next=node.next;
        }
        this.length--;
    }
    delIndex(index){
        if (this.length===0) {
            throw 'there is not anymore aports';
        }
        if (index==0) {
            this.head=this.head.next;
            this.length--;
            return;
        }

        var prevNode=null;
        var current=this.head;
        var count=0;
        while(count<index){
            prevNode=current;
            count++;
            current=current.next
        }
        prevNode.next=current.next;
        this.length--;

    }

    clear(){
        this.head=null;
        this.length=0;
    }
}
