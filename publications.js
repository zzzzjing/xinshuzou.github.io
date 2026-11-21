/*
  论文列表：每篇论文一行，按年份自动分组、自动排序。
  加新论文：复制一行，改掉下面这些字段即可。
    y   年份
    t   标题
    a   作者（X. Zou 会自动加粗；以 X. Zou 开头即视为第一作者）
    j   期刊名
    v   卷, 页码（没有可以留空 ""）
    th  分类：ice 冰与水合物 / optics 光学薄膜 / max 陶瓷与 MXene / energy 电池
    doi DOI 号（标题会链接到 https://doi.org/ 加上这个号）
*/
window.PUBS = [
  {y:2025, t:"Anti-ice and Anti-hydrate Surfaces", a:"X. Zou", j:"Norwegian University of Science and Technology (NTNU)", th:"ice", thesis:true},
  {y:2025, t:"A stress-based criterion for interpreting size-dependent ice debonding behavior", a:"T. Hao, L. Zhao, Y. Lei, X. Zou, J. Zhang, H. Guo", j:"International Journal of Mechanical Sciences", v:"", th:"ice", doi:"10.1016/j.ijmecsci.2025.110436"},
  {y:2025, t:"Hypothesis: A sustainable dynamic anti-icing surface with the potential for rapid rechargeability", a:"X. Zou, F. Wang, J. He, Z. Zhang", j:"Journal of Colloid and Interface Science", v:"", th:"ice", doi:"10.1016/j.jcis.2024.11.009"},
  {y:2024, t:"Highly reversible and stable sulfur-containing cathodes for magnesium batteries with two-plateau redox reactions enabled by kinetically favored Mg–S decomposition", a:"H. Xu, T. Xie, Y. Li, F. Sun, C. Zhang, Z. Li, …, X. Zou, et al.", j:"Advanced Energy Materials", v:"", th:"energy", doi:"10.1002/aenm.202401154"},
  {y:2023, t:"Designing multifunctional silica coatings for enhanced broadband antireflection and microfiber contamination sensing", a:"X. Zou, G. Zhou, Y. Wan, B. Li, B. Jiang, C. Tao, F. Wang, H. Yan", j:"Chemical Engineering Journal", v:"473, 145234", th:"optics", doi:"10.1016/j.cej.2023.145234"},
  {y:2022, t:"High strength and plasticity in Cr–Al–C composite", a:"X. Zou, Z. Zhang, S. Song, X. Wang, J. Joardar, K. M. Reddy", j:"Materials Science and Engineering: A", v:"835, 142684", th:"max", doi:"10.1016/j.msea.2022.142684"},
  {y:2022, t:"Li⁺ assisted fast and stable Mg²⁺ reversible storage in cobalt sulfide cathodes for high performance magnesium/lithium hybrid-ion batteries", a:"H. Xu, X. Zhang, …, X. Zou, et al.", j:"Energy Storage Materials", v:"46, 583–593", th:"energy", doi:"10.1016/j.ensm.2022.01.041"},
  {y:2021, t:"A simple approach to synthesis Cr₂CTₓ MXene for efficient hydrogen evolution reaction", a:"X. Zou, H. Xu, X. Wu, X. Han, J. Kang, K. M. Reddy, et al.", j:"Materials Today Energy", v:"20, 100668", th:"max", doi:"10.1016/j.mtener.2021.100668"},
  {y:2021, t:"Influence of heating rate on formation of nanostructured tungsten carbides during thermo-chemical processing", a:"K. M. Reddy, X. Zou, Y. Hu, H. Zhang, T. N. Rao, J. Joardar", j:"Advanced Powder Technology", v:"32, 121–130", th:"max", doi:"10.1016/j.apt.2020.11.023"},
  {y:2020, t:"Structure and mechanical properties of nanostructured rhombohedral Cr₅Al₈", a:"X. Zou, M. Rachakonda, S. Chu, X. Zhao, J. Joardar, K. M. Reddy", j:"Materials Characterization", v:"172, 110862", th:"max", doi:"10.1016/j.matchar.2020.110862"},
  {y:2019, t:"Photomechanical effect leading to extraordinary ductility in covalent semiconductors", a:"H. Wang, S. Song, X. Zou, F. Wang, S. I. Morozov, X. Wang, K. M. Reddy, Q. An, et al.", j:"Physical Review B", v:"100, 094110", th:"max", doi:"10.1103/PhysRevB.100.094110"},
  {y:2019, t:"A hydrophobic ultralow refractive-index silica coating towards double-layer broadband antireflective coating with exceptionally high vacuum stability and laser-induced damage threshold", a:"C. Tao, X. Zou, K. M. Reddy, L. Zhang, B. Jiang", j:"Colloids and Surfaces A", v:"563, 340–349", th:"optics", doi:"10.1016/j.colsurfa.2018.11.038"},
  {y:2018, t:"Rational design and fabrication of highly transparent, flexible, and thermally stable superhydrophobic coatings from raspberry-like hollow silica nanoparticles", a:"X. Zou, C. Tao, K. Yang, F. Yang, H. Lv, L. Yan, H. Yan, Y. Li, et al.", j:"Applied Surface Science", v:"440, 700–711", th:"optics", doi:"10.1016/j.apsusc.2018.01.159"},
  {y:2018, t:"One-step sol-gel preparation of ultralow-refractive-index porous coatings with mulberry-like hollow silica nanostructures", a:"X. Zou, C. Tao, L. Yan, F. Yang, H. Lv, H. Yan, Z. Wang, Y. Li, et al.", j:"Surface and Coatings Technology", v:"341, 57–63", th:"optics", doi:"10.1016/j.surfcoat.2018.01.013"},
  {y:2018, t:"Fabrication of robust, self-cleaning, broadband TiO₂–SiO₂ double-layer antireflective coatings with closed-pore structure through a surface sol-gel process", a:"C. Tao, X. Zou, K. Du, G. Zhou, H. Yan, X. Yuan, et al.", j:"Journal of Alloys and Compounds", v:"747, 43–49", th:"optics", doi:"10.1016/j.jallcom.2018.03.008"},
  {y:2018, t:"Ultralow-refractive-index optical thin films built from shape-tunable hollow silica nanomaterials", a:"C. Tao, X. Zou, K. Du, L. Zhang, H. Yan, X. Yuan", j:"Optics Letters", v:"43, 1802–1805", th:"optics", doi:"10.1364/OL.43.001802"},
  {y:2018, t:"Double-layer tri-wavelength hydrophobic antireflective coatings derived from methylated silica nanoparticles and hybrid silica nanoparticles", a:"C. Tao, K. Yang, X. Zou, H. Yan, X. Yuan, L. Zhang, B. Jiang", j:"Journal of Sol-Gel Science and Technology", v:"86, 285–292", th:"optics", doi:"10.1007/s10971-018-4642-x"},
  {y:2018, t:"Three-dimensional TiO₂/SiO₂ composite aerogel films via atomic layer deposition with enhanced H₂S gas sensing performance", a:"F. Yang, J. Zhu, X. Zou, X. Pang, R. Yang, S. Chen, Y. Fang, T. Shao, et al.", j:"Ceramics International", v:"44, 1078–1085", th:"optics", doi:"10.1016/j.ceramint.2017.10.052"},
  {y:2018, t:"Micro/nanofiber with hollow silica nanoparticles thin-film for airborne molecular contaminants real-time sensing", a:"L. Niu, G. Zhou, X. Miao, X. Yuan, R. Kumar, H. Liu, Y. Jiang, X. Zou, et al.", j:"Advances in Condensed Matter Physics", v:"", th:"optics", doi:"10.1155/2018/4950787"},
  {y:2017, t:"Surface molecular structure defects and laser-induced damage threshold of fused silica during a manufacturing process", a:"Y. Li, H. Yan, K. Yang, C. Yao, …, X. Zou, et al.", j:"Scientific Reports", v:"7", th:"optics", doi:"10.1038/s41598-017-18249-2"},
  {y:2017, t:"Improvement of laser damage thresholds of fused silica by ultrasonic-assisted hydrofluoric acid etching", a:"Y. Li, H. Yan, K. Yang, C. Yao, Z. Wang, C. Yan, X. Zou, et al.", j:"Chinese Physics B", v:"26, 118104", th:"optics", doi:"10.1088/1674-1056/26/11/118104"}
];
