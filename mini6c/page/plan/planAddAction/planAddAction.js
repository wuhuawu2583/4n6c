const config = require('../../../config')
const app = getApp()
/*
Page({
  onLoad: function (options) {
    console.info("打开planId=" + options.id);
  }
})*/

Page({

  onLoad: function (options) {
    console.info("ComponentplanId=" + options.id);
    this.setData({
      planId: options.id,
      planCyle: options.planCyle
    })

    
  },
  data: {
    showTopTips: false,
    date: "请选择",  
    userId:'',
    userName:'请选择', 
    dateStart: '2020-04-01', 
    dateEnd: '2020-10-01', 

    formData: {      
      action: "",
      name:'',
      outcome:'',
      unFinishRemark:'',
      userId: ''
    },
    rules: [{
        name: 'action',
        rules: { required: true, message: '请输入工作事项内容' },
      }, {
        name: 'date',
        rules: { required: true, message: '请选择完成时间'},
      }, {
        name: 'userId',
          rules: {required: true, message: '请选择检查人'},
    }]
  },
     
      bindDateChange: function (e) {
          this.setData({
              date: e.detail.value,
              [`formData.date`]: e.detail.value
          })
      },
      formInputChange(e) {
          const {field} = e.currentTarget.dataset
          this.setData({
              [`formData.${field}`]: e.detail.value
          })
      },  

  selectOneUser: function (e) {      
      wx.navigateTo({ url: '../../user/suser/suser'})
    },      
              
      submitForm() {
        this.selectComponent('#form').validate((valid, errors) => {
            //console.log('valid', valid, errors)
            if (!valid) {
                const firstError = Object.keys(errors)
                if (firstError.length) {
                    this.setData({
                        error: errors[firstError[0]].message
                    })    
                }
            } else {
              //wx.showToast({
              //    title: '校验通过'
              //})

              this.saveNewAction(this.data.formData)
            }
      })
          
    },
    saveNewAction: function (formData) {
      
      console.info("form data planId= " + this.data.planId) 
      console.info("form data planCyle= " + this.data.planCyle) 
      console.info("form data action= " + formData.action)  
      console.info("form data name= " + formData.name)  
      console.info("form data date = " + formData.date)  
      console.info("form data outcome = " + formData.outcome)  
      console.info("form data unFinishRemark = " + formData.unFinishRemark)  
      console.info("form data inspectorId = " + this.data.userId) 
      

      const self = this
      var sessionId = app.globalData.sessionId
      
      console.log('【1.begin wx.request】:' + sessionId)

      if (sessionId) {
        console.log('【2.begin config.domain】:' + config.domain)

        wx.request({
          url: config.domain + '/planCr/saveNewAction',
          data: {
            planId: this.data.planId,
            action: formData.action,
            outcome: formData.outcome,
            unFinishRemark: formData.unFinishRemark,
            commitDate: formData.date,
            inspectorId: this.data.userId
          },
          method: 'POST',
          dataType: 'json',
          header: {
            'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'Cookie': 'JSESSIONID=' + sessionId
          },
          success(result) {

            let pages = getCurrentPages();
            let prevPage = pages[pages.length - 2]
            var plan = prevPage.data.plan;
            var planDetail = {
              id:result.data.data,
              planId: self.data.planId,
              action: formData.action,
              outcome: formData.outcome,
              unFinishRemark: formData.unFinishRemark,
              commitDate: formData.date,
              inspectorId: self.data.userId
            };
            plan.actionDetails.push(planDetail);

            prevPage.setData({
              plan:plan
            })
            wx.navigateBack({
              delta: 1
            })
            /*
            var planCyle=self.data.planCyle
            var planId=self.data.planId
            if(planCyle==0){
              wx.navigateTo({ url: '../planDetailWeek/planDetailWeek?id=' + planId })
            }else if(planCyle==1){
              wx.navigateTo({ url: '../planDetailMonth/planDetailMonth?id=' + planId })
            }else{
              wx.navigateTo({ url: '../planDetailYear/planDetailYear?id=' + planId })
            }
            */
          },

          fail({ errMsg }) {
            console.log('【plan/saveNewAction fail】', errMsg)
          }
        })
      }

      console.log('【2.End wx.request】')

    },
  
    onUnload:function(){
      /*
      const self = this
      var planId=self.data.planId
      wx.switchTab({
        url: '../planDetailWeek/planDetailWeek?id=' + planId
      })
      */
    },

});
