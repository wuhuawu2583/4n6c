const config = require('../../../config')
const app = getApp()
Page({
  onLoad: function () { 
  },

  onShareAppMessage() {
    return {
      title: '用户认证',
      path: 'page/user/scan-code/scan-code'
    }
  },
     
  data: {
    qa: '',
    scResult:false
  },

   scanCode() {
      const that = this
      wx.scanCode({
      success(res) {
         if(res.result){
            that.setData({
              qa: res.result               
            })  
            //console.log('【1.scanCode success】', res.result)            
            that.gotoMark()
         } 
      },
      fail() {
         console.log('【1x.scanCode fail】')
         that.setData({
            qa: '',
            scResult: false
         })
      }
    })
   },

   gotoMark:function() {
    
     //console.log('【2.gotoMark】' + app.globalData.openid)
     const self = this

     self.setData({
          loading: true
     })

      //console.log('【3.begin wx.request')


      wx.request({
        url: config.domain +'/userController/wxBinding',
         data: {
          openid: app.globalData.openid,
          qa: this.data.qa            
         },
         method: 'POST',
         header: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' },
         success(result) {
              
          //使用openid登陆，获取后台session
          wx.request({
            url: config.domain +'/userController/wxLogin',
            data: {
              openid: getApp().globalData.openid,
              wxVersion: "2.0"
            },
            method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            success(result) {
              //获取新的sessionId,并保存下来
              getApp().globalData.sessionId = result.data.data
              wx.setStorageSync('sessionId', result.data.data)
              
              getApp().globalData.bindingUser = result.data.obj.name
              getApp().globalData.bindingUserId = result.data.obj.id
              
              //绑定成功，默认登录了，不需要用户再重新登录，改善用户体验
              getApp().globalData.hasLogin = true 

              //console.log('【wxLogin 绑定的sessioniD=】', result.data.obj.name)
              
              //wx.setStorageSync('GLB_ORGUsers', null) 
              //wx.setStorageSync('GLB_LastModifyUserTime', null)

            },

            fail({ errMsg }) {
              console.log('【wxLogin fail】', errMsg)
              //this.globalData.sessionId = ''
            }
          })
          //登陆END


          wx.showToast({
              title: '绑定成功',
              icon: 'success',
              mask: true,
              duration:1000
          })

          wx.reLaunch({
            url: '/page/home/home'
          })          

          self.setData({
              loading: false,
              scResult: true
          })
          //console.log('【request success】', result.data.msg)    
                  
         },

         fail({ errMsg }) {
            console.log('【request fail】', errMsg)
            self.setData({
               loading: false,
               scResult: false
            })
         }
      })

      //console.log('【4.End wx.request')

   },

   returnPage(){
     wx.redirectTo({ url: '../../user/phone-login/phone-login' })     
   }
})
