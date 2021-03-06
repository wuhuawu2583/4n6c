const config = require('../../../config')
const app = getApp()

Page({
  
  onLoad: function(){   
    
    this.setData({     
        hasUserInfo: false,   
        planList: ''
    })

    //获取最新消息数据
    const self = this
    var sessionId = app.globalData.sessionId
    if (sessionId) {
      wx.request({
        url: config.domain + '/planCr/createWeekPaln',
        data: {
          api: "list"
        },
        method: 'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Cookie': 'JSESSIONID=' + sessionId
        },
        success(result) {
          self.setData({
            planList: result.data.data
          })
        },

        fail({ errMsg }) {
          console.log('【plan/planList fail】', errMsg)
        }
      })
    }

  },

  radioChange(e) {

    const items = this.data.planList
    for (let i = 0, len = items.length; i < len; ++i) {
   
      if(items[i].seq==e.detail.value){
        items[i].selected=true
      }else{
        items[i].selected=false
      }
    }
    this.setData({
      planList:items
    })
  },

  createdWeekPlan:function(){  

    const self = this
    const items = self.data.planList

    var min;
	  var max;
    if(items.length==2){
      min=items[0].seq;
      max=items[1].seq;
    }

    var setWeek=[];
    var isCreated=true;
    for (let i = 0, len = items.length; i < len; ++i) {
     
      if(items[i].selected==true){
        setWeek=items[i];
        if(items.length==2 && min!=setWeek.seq){
          isCreated=false;
        }
      }
    }

    var layerMsg="还没有创建"+min+"周计划，就创建"+max+"周计划，将导致无法创建"+min+"周计划,请谨慎!";
		
		if(!isCreated){
      wx.showModal({  
        title: '提示',  
        content: layerMsg,  
        cancelText:'不再创建',
        confirmText:'继续创建',
        success: function(res) {  
              if (res.confirm) {  
                //用户点击确认按钮执行创建周计划代码
                self.checkOrCreatePlanWeek(setWeek.year,setWeek.seq)
                
              } else if (res.cancel) { 
                //用户点击取消按钮执行如下代码
              }  
          }  
      }) 
    }else{
      self.checkOrCreatePlanWeek(setWeek.year,setWeek.seq)
    }
  } , 

  //创建周计划方法
  checkOrCreatePlanWeek: function(year,seq){   
    
    var sessionId = app.globalData.sessionId
    //判断是否提交了上周计划，如果已经提交了上周计划，则可以创建本周计划
    wx.request({
      url: config.domain + '/planCr/findPrePlanWeekByUserId',
      data : {
        year: year,
        seq: seq
      },
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Cookie': 'JSESSIONID=' + sessionId
      },
      success(result) {
        if(result.data.success==true){
          wx.request({
            url: config.domain + '/planCr/createWeek',
            data : {
              year: year,
              seq: seq
            },
            method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
              'Cookie': 'JSESSIONID=' + sessionId
            },
            success(result) {
                //创建成功自动返回上级页面
                if(result.data.success==true){
                  var id = result.data.data
                  wx.redirectTo({ url: '../planDetailWeek/planDetailWeek?id=' + id})
                }else{ 

                }
            },
            fail({ errMsg }) {
              //创建失败提示错误信息代码开始
            }
          })
        }else{
           //否则没有提交上周计划，则提示必须提交上周计划，才能创建该周计划
          var errormsg='必须先提交第'+result.data.msg+'周计划结果,才能创建该周计划';
          wx.showModal({  
            title: '提示',  
            content: errormsg,  
            showCancel:false,
            confirmText:'关闭',
            success: function(res) {  
                
            }  
          })   
        } 
      },
      fail({ errMsg }) {

      }
    })
  },
 
  navigateBack() {
    wx.navigateBack()
  },

})
