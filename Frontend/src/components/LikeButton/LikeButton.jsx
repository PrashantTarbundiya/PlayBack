import React from 'react';
import styled from 'styled-components';

const LikeButton = ({ isLiked, likesCount, onLike, disabled }) => {
  return (
    <StyledWrapper>
      <div className="like-container">
        <label className="btn-label" htmlFor="like-checkbox">
          <input 
            className="input-box" 
            id="like-checkbox" 
            type="checkbox" 
            checked={isLiked}
            onChange={onLike}
            disabled={disabled}
          />
          <svg className="svgs" id="icon-like-solid" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M313.4 32.9c26 5.2 42.9 30.5 37.7 56.5l-2.3 11.4c-5.3 26.7-15.1 52.1-28.8 75.2H464c26.5 0 48 21.5 48 48c0 18.5-10.5 34.6-25.9 42.6C497 275.4 504 288.9 504 304c0 23.4-16.8 42.9-38.9 47.1c4.4 7.3 6.9 15.8 6.9 24.9c0 21.3-13.9 39.4-33.1 45.6c.7 3.3 1.1 6.8 1.1 10.4c0 26.5-21.5 48-48 48H294.5c-19 0-37.5-5.6-53.3-16.1l-38.5-25.7C176 420.4 160 390.4 160 358.3V320 272 247.1c0-29.2 13.3-56.7 36-75l7.4-5.9c26.5-21.2 44.6-51 51.2-84.2l2.3-11.4c5.2-26 30.5-42.9 56.5-37.7zM32 192H96c17.7 0 32 14.3 32 32V448c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32V224c0-17.7 14.3-32 32-32z" />
          </svg>
          <svg className="svgs" id="icon-like-regular" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M323.8 34.8c-38.2-10.9-78.1 11.2-89 49.4l-5.7 20c-3.7 13-10.4 25-19.5 35l-51.3 56.4c-8.9 9.8-8.2 25 1.6 33.9s25 8.2 33.9-1.6l51.3-56.4c14.1-15.5 24.4-34 30.1-54.1l5.7-20c3.6-12.7 16.9-20.1 29.7-16.5s20.1 16.9 16.5 29.7l-5.7 20c-5.7 19.9-14.7 38.7-26.6 55.5c-5.2 7.3-5.8 16.9-1.7 24.9s12.3 13 21.3 13L448 224c8.8 0 16 7.2 16 16c0 6.8-4.3 12.7-10.4 15c-7.4 2.8-13 9-14.9 16.7s.1 15.8 5.3 21.7c2.5 2.8 4 6.5 4 10.6c0 7.8-5.6 14.3-13 15.7c-8.2 1.6-15.1 7.3-18 15.1s-1.6 16.7 3.6 23.3c2.1 2.7 3.4 6.1 3.4 9.9c0 6.7-4.2 12.6-10.2 14.9c-11.5 4.5-17.7 16.9-14.4 28.8c.4 1.3 .6 2.8 .6 4.3c0 8.8-7.2 16-16 16H286.5c-12.6 0-25-3.7-35.5-10.7l-61.7-41.1c-11-7.4-25.9-4.4-33.3 6.7s-4.4 25.9 6.7 33.3l61.7 41.1c18.4 12.3 40 18.8 62.1 18.8H384c34.7 0 62.9-27.6 64-62c14.6-11.7 24-29.7 24-50c0-4.5-.5-8.8-1.3-13c15.4-11.7 25.3-30.2 25.3-51c0-6.5-1-12.8-2.8-18.7C504.8 273.7 512 257.7 512 240c0-35.3-28.6-64-64-64l-92.3 0c4.7-10.4 8.7-21.2 11.8-32.2l5.7-20c10.9-38.2-11.2-78.1-49.4-89zM32 192c-17.7 0-32 14.3-32 32V448c0 17.7 14.3 32 32 32H96c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32H32z" />
          </svg>
          <span className="like-text-content">{likesCount}</span>
          <div className="fireworks">
            <div className="checked-like-fx" />
          </div>
        </label>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .like-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: .8;
    cursor: pointer;
    user-select: none;
    border: 1px solid #4b5563;
    border-radius: 50px;
    transition: .2s ease all;
    background: #374151;
  }

  .like-container:hover {
    opacity: 1;
    background: #4b5563;
    box-shadow: 0 5px 15px 0 #00000026;
  }

  .like-container:active {
    box-shadow: 0 5px 5px 0 #00000026;
  }

  .like-container .btn-label {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px 16px;
    margin: 2px 2px;
    cursor: pointer;
    position: relative;
    height: 39px;
    box-sizing: border-box;
  }

  .like-container .like-text-content {
    border-left: 0.1rem solid #9ca3af;
    padding: 0 8px 0 12px;
    pointer-events: none;
    color: #d1d5db;
    font-size: 14px;
    font-weight: 500;
  }

  .like-container .svgs {
    width: 20px;
    height: 20px;
    fill: #d1d5db;
    box-sizing: content-box;
    padding: 0 12px 0 8px;
    transition: .2s ease all;
  }

  /* Hide the default checkbox */
  .like-container .input-box {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .like-container #icon-like-regular {
    display: block;
  }

  .like-container #icon-like-solid {
    display: none;
  }

  .like-container:hover :is(#icon-like-solid, #icon-like-regular) {
    animation: rotate-icon-like 0.7s ease-in-out both;
  }

  .like-container #like-checkbox:checked ~ #icon-like-regular {
    display: none;
    animation: checked-icon-like 0.5s;
  }

  .like-container #like-checkbox:checked ~ #icon-like-solid {
    display: block;
    animation: checked-icon-like 0.5s;
    fill: #3b82f6;
  }

  .like-container #like-checkbox:checked ~ .like-text-content {
    color: #3b82f6;
  }

  .like-container .fireworks {
    transform: scale(0.4);
  }

  .like-container #like-checkbox:checked ~ .fireworks > .checked-like-fx {
    position: absolute;
    width: 10px;
    height: 10px;
    right: 40px;
    border-radius: 50%;
    box-shadow: 0 0 #3b82f6, 0 0 #3b82f6, 0 0 #3b82f6, 0 0 #3b82f6, 0 0 #3b82f6, 0 0 #3b82f6, 0 0 #3b82f6, 0 0 #3b82f6, 0 0 #3b82f6, 0 0 #3b82f6, 0 0 #3b82f6, 0 0 #3b82f6, 0 0 #3b82f6, 0 0 #3b82f6, 0 0 #3b82f6, 0 0 #3b82f6, 0 0 #3b82f6, 0 0 #3b82f6, 0 0 #3b82f6, 0 0 #3b82f6;
    animation: 1s fireworks-bang ease-out forwards, 1s fireworks-gravity ease-in forwards, 5s fireworks-position linear forwards;
    animation-duration: 1.25s, 1.25s, 6.25s;
  }

  /* Shake Animation */
  @keyframes rotate-icon-like {
    0% {
      transform: rotate(0deg) translate3d(0, 0, 0);
    }
    25% {
      transform: rotate(3deg) translate3d(0, 0, 0);
    }
    50% {
      transform: rotate(-3deg) translate3d(0, 0, 0);
    }
    75% {
      transform: rotate(1deg) translate3d(0, 0, 0);
    }
    100% {
      transform: rotate(0deg) translate3d(0, 0, 0);
    }
  }

  /* Checked Animation */
  @keyframes checked-icon-like {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.2) rotate(-10deg);
    }
  }

  /* Fireworks Animation */
  @keyframes fireworks-position {
    0%, 19.9% {
      margin-top: 10%;
      margin-left: 40%;
    }
    20%, 39.9% {
      margin-top: 40%;
      margin-left: 30%;
    }
    40%, 59.9% {
      margin-top: 20%;
      margin-left: 70%;
    }
    60%, 79.9% {
      margin-top: 30%;
      margin-left: 20%;
    }
    80%, 99.9% {
      margin-top: 30%;
      margin-left: 80%;
    }
  }

  @keyframes fireworks-gravity {
    to {
      transform: translateY(200px);
      opacity: 0;
    }
  }

  @keyframes fireworks-bang {
    to {
      box-shadow: 114px -107.3333333333px #3b82f6, 212px -166.3333333333px #60a5fa, 197px -6.3333333333px #3b82f6, 179px -329.3333333333px #1d4ed8, -167px -262.3333333333px #3b82f6, 233px 65.6666666667px #60a5fa, 81px 42.6666666667px #1d4ed8, -13px 54.6666666667px #3b82f6, -60px -183.3333333333px #1d4ed8, 127px -259.3333333333px #3b82f6, 117px -122.3333333333px #60a5fa, 95px 20.6666666667px #3b82f6, 115px 1.6666666667px #1d4ed8, -160px -328.3333333333px #3b82f6, 69px -242.3333333333px #1d4ed8, -208px -230.3333333333px #3b82f6, 30px -15.3333333333px #60a5fa, 235px -15.3333333333px #3b82f6, 80px -232.3333333333px #60a5fa, 175px -173.3333333333px #3b82f6, -187px -176.3333333333px #60a5fa, 4px 26.6666666667px #3b82f6, 227px -106.3333333333px #3b82f6, 119px 17.6666666667px #60a5fa, -102px 4.6666666667px #3b82f6, -16px -4.3333333333px #60a5fa, -201px -310.3333333333px #60a5fa, 64px -181.3333333333px #3b82f6, -234px -15.3333333333px #60a5fa, -184px -263.3333333333px #1d4ed8, 96px -303.3333333333px #1d4ed8, -139px 10.6666666667px #1d4ed8, 25px -205.3333333333px #3b82f6, -129px -322.3333333333px #60a5fa, -235px -187.3333333333px #60a5fa, -136px -237.3333333333px #1d4ed8, -82px -321.3333333333px #1d4ed8, 7px -267.3333333333px #3b82f6, -155px 30.6666666667px #1d4ed8, -85px -73.3333333333px #1d4ed8, 60px -199.3333333333px #60a5fa, -9px -289.3333333333px #60a5fa, -208px -167.3333333333px #60a5fa, -13px -299.3333333333px #3b82f6, 179px -164.3333333333px #3b82f6, -112px 12.6666666667px #1d4ed8, -209px -125.3333333333px #3b82f6, 14px -101.3333333333px #60a5fa, -184px -292.3333333333px #3b82f6, -26px -168.3333333333px #60a5fa, 129px -67.3333333333px #1d4ed8, -17px -23.3333333333px #1d4ed8, 129px 34.6666666667px #1d4ed8, 35px -24.3333333333px #60a5fa, -12px -297.3333333333px #3b82f6, 129px -156.3333333333px #60a5fa, 157px -29.3333333333px #1d4ed8, -221px 6.6666666667px #3b82f6, 0px -311.3333333333px #3b82f6, 155px 50.6666666667px #60a5fa, -71px -318.3333333333px #1d4ed8;
    }
  }

  /* Disabled state */
  .like-container:has(.input-box:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .like-container:has(.input-box:disabled):hover {
    background: #374151;
    box-shadow: none;
  }
`;

export default LikeButton;